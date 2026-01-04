use tauri::Emitter;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader as AsyncBufReader};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;
use std::sync::Arc;
use std::collections::HashMap;
use std::path::{Path};
use std::fs;
use serde::{Deserialize, Serialize};
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use std::io::{Read, Write};

// Global state to manage agent processes and callbacks
static AGENT_PROCESSES: std::sync::LazyLock<Arc<Mutex<HashMap<String, tokio::process::Child>>>> = 
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

static LISTENING_TASKS: std::sync::LazyLock<Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>>> = 
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[derive(Deserialize, Debug)]
pub struct ModelSettings {
    #[serde(alias = "model")]
    model: String,
    #[serde(alias = "baseUrl")]
    base_url: String,
    #[serde(alias = "apiKey")]
    api_key: String,
}

#[tauri::command]
pub async fn acp_initialize(
    agent: &str,
    settings: Option<ModelSettings>,
) -> Result<serde_json::Value, serde_json::Value> {
    println!("acp_initialize called with agent: {}, settings: {:?}", agent, settings);
    let agent_parts: Vec<&str> = agent.split("::").collect();
    let agent_name = agent_parts.first().unwrap_or(&agent);
    
    let mut args = vec!["x".into()];
    // Create environment variables map based on agent type
    let mut env_vars: HashMap<String, String> = HashMap::new();
    if *agent_name == "qwen" {
        args.push("@qwen-code/qwen-code".into());
        if let Some(ms) = settings {
            args.extend(["--auth-type".into(), "openai".into()]);
            env_vars.insert("OPENAI_API_KEY".into(), ms.api_key);
            env_vars.insert("OPENAI_BASE_URL".into(), ms.base_url);
            env_vars.insert("OPENAI_MODEL".into(), ms.model);
        }
        args.push("--experimental-acp".into());
    } else if *agent_name == "codex" {
        args.push("@zed-industries/codex-acp".into());
        if let Some(ms) = settings {
            args.extend(["-c".into(), "model_provider=x".into(),
                "-c".into(), "model_providers.x.name=x".into(),
                "-c".into(), format!("model_providers.x.base_url={}", ms.base_url),
                "-c".into(), "model_providers.x.env_key=X_API_KEY".into(),
                "-c".into(), "model_provider=x".into(),
                "-c".into(), format!("model={}", ms.model),
            ]);
            env_vars.insert("X_API_KEY".into(), ms.api_key);
        }
    } else if *agent_name == "claude" {
        args.push("@zed-industries/claude-code-acp".into());
        if let Some(ms) = settings {
            env_vars.insert("ANTHROPIC_BASE_URL".into(), ms.base_url);
            env_vars.insert("ANTHROPIC_MODEL".into(), ms.model);
            env_vars.insert("ANTHROPIC_AUTH_TOKEN".into(), ms.api_key);
            env_vars.insert("API_TIMEOUT_MS".into(), "600000".into());
        }
    } else if *agent_name == "gemini" {
        args.push("@google/gemini-cli".into());
        if let Some(ms) = settings {
            env_vars.insert("GEMINI_MODEL".into(), ms.model);
            env_vars.insert("GOOGLE_GEMINI_BASE_URL".into(), ms.base_url);
            env_vars.insert("GEMINI_API_KEY".into(), ms.api_key);
        }
        args.push("--experimental-acp".into());
    } else {
        return Err(serde_json::json!({
            "code": 9,
            "message": format!("Unknown agent type: {}", agent_name)
        }));
    }
    
    // println!("Command args: {:?}", args);
    // println!("Environment vars: {:?}", env_vars);
    let mut command = TokioCommand::new("bun");
    
    // Apply environment variables from the map
    for (key, value) in env_vars {
        command.env(key, value);
    }
    
    let child = command
        .args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| serde_json::json!({
            "code": 1,
            "message": format!("Failed to start {} process: {}", agent_name, e)
        }))?;

    // Store the process for later communication
    {
        let mut processes = AGENT_PROCESSES.lock().await;
        processes.insert(agent.to_string(), child);
    }

    println!("Agent {} initialized successfully", agent);
    Ok(serde_json::json!({
        "code": 0,
    }))
}

#[tauri::command]
pub async fn acp_send_message(agent: &str, message: serde_json::Value) -> Result<serde_json::Value, serde_json::Value> {
    let mut processes = AGENT_PROCESSES.lock().await;
    let child = processes.get_mut(agent)
        .ok_or_else(|| serde_json::json!({
            "code": 2,
            "message": format!("Agent {} not found", agent)
        }))?;

    if let Some(stdin) = child.stdin.as_mut() {
        let json_str = message.to_string();
        stdin.write_all(json_str.as_bytes()).await
            .map_err(|e| serde_json::json!({
                "code": 3,
                "message": format!("Failed to write to stdin: {}", e)
            }))?;
        stdin.write_all(b"\n").await
            .map_err(|e| serde_json::json!({
                "code": 4,
                "message": format!("Failed to write newline to stdin: {}", e)
            }))?;
        stdin.flush().await.map_err(|e| serde_json::json!({
            "code": 5,
            "message": format!("Failed to flush stdin: {}", e)
        }))?;
        println!("Message sent to agent {} {}", agent, json_str);
    }

    Ok(serde_json::json!({
        "code": 0,
    }))
}

#[tauri::command]
pub async fn acp_start_listening(agent: &str, window: tauri::Window) -> Result<serde_json::Value, serde_json::Value> {
    let agent_name = agent.to_string();
    let window_clone = window.clone();
    let agent_name_clone = agent_name.clone();
    
    let handle = tokio::spawn(async move {
        let mut reader_opt = None;
        
        // Take stdout once at the beginning
        {
            let mut processes = AGENT_PROCESSES.lock().await;
            if let Some(child) = processes.get_mut(&agent_name_clone) {
                if let Some(stdout) = child.stdout.take() {
                    reader_opt = Some(AsyncBufReader::new(stdout));
                }
            }
        }
        let evt = "acp_message::".to_string() + &agent_name_clone;
        if let Some(mut reader) = reader_opt {
            loop {
                // Check if agent still exists
                let agent_exists = {
                    let processes = AGENT_PROCESSES.lock().await;
                    processes.contains_key(&agent_name_clone)
                };
                
                if !agent_exists {
                    break;
                }
                
                let mut line = String::new();
                
                match reader.read_line(&mut line).await {
                    Ok(0) => {
                        // EOF reached
                        let _ = window_clone.emit(evt.as_str(), serde_json::json!({
                            "type": "disconnect",
                        }));
                        break;
                    },
                    Ok(n) => {
                        println!("Read {} bytes: {}", n, line.trim());
                        
                        let event_data = serde_json::json!({
                            "type": "message",
                            "message": line.trim().to_string()
                        });
                        
                        let _ = window_clone.emit(evt.as_str(), event_data);
                    },
                    Err(e) => {
                        println!("Error reading from stdout: {}", e);
                        let _ = window_clone.emit(evt.as_str(), serde_json::json!({
                            "type": "error",
                            "error": format!("Read error: {}", e)
                        }));
                        break;
                    }
                }
            }
            
            // Return stdout to the child process
            {
                let mut processes = AGENT_PROCESSES.lock().await;
                if let Some(child) = processes.get_mut(&agent_name_clone) {
                    let _ = child.stdout.replace(reader.into_inner());
                }
            }
        }
    });
    
    // Store the task handle
    {
        let mut tasks = LISTENING_TASKS.lock().await;
        tasks.insert(agent_name, handle);
    }
    
    println!("Started listening to agent {}", agent);
    Ok(serde_json::json!({
        "code": 0,
    }))
}

#[tauri::command]
pub async fn acp_stop_listening(agent: &str) -> Result<serde_json::Value, serde_json::Value> {
    let mut tasks = LISTENING_TASKS.lock().await;
    
    if let Some(handle) = tasks.remove(agent) {
        handle.abort();
        println!("Stopped listening to agent {}", agent);
        Ok(serde_json::json!({
            "code": 0,
        }))
    } else {
        Err(serde_json::json!({
            "code": 6,
            "message": format!("No active listener for agent {}", agent)
        }))
    }
}

#[tauri::command]
pub async fn acp_dispose(agent: &str) -> Result<serde_json::Value, serde_json::Value> {
    println!("acp_dispose {}", agent);
    
    // First stop listening if active
    {
        let mut tasks = LISTENING_TASKS.lock().await;
        if let Some(handle) = tasks.remove(agent) {
            handle.abort();
        }
    }
    
    // Then kill and remove the process
    {
        let mut processes = AGENT_PROCESSES.lock().await;
        if let Some(mut child) = processes.remove(agent) {
            // Try to kill the process gracefully first
            match child.kill().await {
                Ok(_) => {
                    // Wait for the process to actually terminate
                    match child.wait().await {
                        Ok(status) => {
                            println!("Agent {} process terminated with status: {}", agent, status);
                        },
                        Err(e) => {
                            println!("Error waiting for agent {} to terminate: {}", agent, e);
                        }
                    }
                },
                Err(e) => {
                    println!("Error killing agent {} process: {}", agent, e);
                    return Err(serde_json::json!({
                        "code": 7,
                        "message": format!("Failed to kill agent process: {}", e)
                    }));
                }
            }
        } else {
            return Err(serde_json::json!({
                "code": 8,
                "message": format!("Agent {} not found", agent)
            }));
        }
    }
    
    println!("Agent {} disposed successfully", agent);
    Ok(serde_json::json!({
        "code": 0,
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    name: String,
    path: String,
    is_file: bool,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
    size: Option<u64>,
}

#[tauri::command]
pub async fn read_directory(path: &str) -> Result<FileNode, String> {
    let path_buf = Path::new(path);
    
    if !path_buf.exists() {
        return Err("Directory does not exist".to_string());
    }

    let metadata = fs::metadata(path_buf)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;

    let name = path_buf.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    if metadata.is_dir() {
        let mut children = Vec::new();
        let entries = fs::read_dir(path_buf)
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let child_path = entry.path();
            let child_metadata = entry.metadata()
                .map_err(|e| format!("Failed to read child metadata: {}", e))?;
            
            let child_name = child_path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let child_node = if child_metadata.is_dir() {
                FileNode {
                    name: child_name,
                    path: child_path.to_string_lossy().to_string(),
                    is_file: false,
                    is_dir: true,
                    children: None, // Lazy load children
                    size: None,
                }
            } else {
                FileNode {
                    name: child_name,
                    path: child_path.to_string_lossy().to_string(),
                    is_file: true,
                    is_dir: false,
                    children: None,
                    size: Some(child_metadata.len()),
                }
            };
            
            children.push(child_node);
        }

        // Sort directories first, then files, both alphabetically
        children.sort_by(|a, b| {
            match (a.is_dir, b.is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.cmp(&b.name),
            }
        });

        Ok(FileNode {
            name,
            path: path_buf.to_string_lossy().to_string(),
            is_file: false,
            is_dir: true,
            children: Some(children),
            size: None,
        })
    } else {
        Ok(FileNode {
            name,
            path: path_buf.to_string_lossy().to_string(),
            is_file: true,
            is_dir: false,
            children: None,
            size: Some(metadata.len()),
        })
    }
}

#[tauri::command]
pub async fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn write_file(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn create_file(path: &str) -> Result<(), String> {
    fs::write(path, "")
        .map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub async fn create_directory(path: &str) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn rename_file(old_path: &str, new_path: &str) -> Result<(), String> {
    fs::rename(old_path, new_path)
        .map_err(|e| format!("Failed to rename: {}", e))
}

#[tauri::command]
pub async fn delete_file(path: &str) -> Result<(), String> {
    let path_buf = Path::new(path);
    
    if path_buf.is_dir() {
        fs::remove_dir_all(path_buf)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(path_buf)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn move_file(from_path: &str, to_path: &str) -> Result<(), String> {
    // Ensure the destination directory exists
    if let Some(parent) = Path::new(to_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    }
    
    fs::rename(from_path, to_path)
        .map_err(|e| format!("Failed to move file: {}", e))
}

struct TerminalSession {
    writer: Box<dyn Write + Send>,
}

static TERMINAL_SESSIONS: std::sync::LazyLock<Arc<Mutex<HashMap<String, TerminalSession>>>> = 
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[tauri::command]
pub async fn terminal_create_session(
    terminal_id: String,
    cwd: Option<String>,
    window: tauri::Window,
) -> Result<serde_json::Value, String> {
    let pty_system = native_pty_system();
    
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to open pty: {}", e))?;

    let shell = if cfg!(target_os = "windows") {
        "cmd.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    };

    let mut cmd = CommandBuilder::new(&shell);
    
    if let Some(working_dir) = cwd {
        cmd.cwd(working_dir);
    }

    let _child = pair.slave.spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    let mut reader = pair.master.try_clone_reader()
        .map_err(|e| format!("Failed to clone reader: {}", e))?;
    
    let writer = pair.master.take_writer()
        .map_err(|e| format!("Failed to take writer: {}", e))?;

    let terminal_id_clone = terminal_id.clone();
    let window_clone = window;
    
    tokio::task::spawn_blocking(move || {
        let event_name = format!("terminal_output::{}", terminal_id_clone);
        let mut buffer = vec![0u8; 8192];
        
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = window_clone.emit(&event_name, serde_json::json!({
                        "type": "stdout",
                        "data": data
                    }));
                }
                Err(e) => {
                    let _ = window_clone.emit(&event_name, serde_json::json!({
                        "type": "error",
                        "data": format!("Error reading output: {}", e)
                    }));
                    break;
                }
            }
        }
    });

    let session = TerminalSession {
        writer,
    };

    let mut sessions = TERMINAL_SESSIONS.lock().await;
    sessions.insert(terminal_id, session);

    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub async fn terminal_send_input(
    terminal_id: String,
    input: String,
) -> Result<serde_json::Value, String> {
    let mut sessions = TERMINAL_SESSIONS.lock().await;
    
    let session = sessions.get_mut(&terminal_id)
        .ok_or_else(|| format!("Terminal session {} not found", terminal_id))?;

    session.writer.write_all(input.as_bytes())
        .map_err(|e| format!("Failed to write to pty: {}", e))?;
    
    session.writer.flush()
        .map_err(|e| format!("Failed to flush pty: {}", e))?;

    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub async fn terminal_kill_session(terminal_id: String) -> Result<(), String> {
    let mut sessions = TERMINAL_SESSIONS.lock().await;
    sessions.remove(&terminal_id);
    Ok(())
}