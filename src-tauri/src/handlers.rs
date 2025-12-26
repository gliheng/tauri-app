use tauri::Emitter;
use tauri::ipc::Invoke;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader as AsyncBufReader};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;
use std::sync::Arc;
use std::collections::HashMap;

// Global state to manage agent processes and callbacks
static AGENT_PROCESSES: std::sync::LazyLock<Arc<Mutex<HashMap<String, tokio::process::Child>>>> = 
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

static LISTENING_TASKS: std::sync::LazyLock<Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>>> = 
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[tauri::command]
async fn initialize_acp(agent: &str) -> Result<String, String> {
    // Launch qwen --experimental-acp with stdin/stdout pipes
    println!("initialize_acp {}", agent);
    let child = TokioCommand::new("bun")
        .args(&["x", "@zed-industries/codex-acp"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start qwen process: {}", e))?;

    // Store the process for later communication
    {
        let mut processes = AGENT_PROCESSES.lock().await;
        processes.insert(agent.to_string(), child);
    }

    Ok(format!("Agent {} initialized successfully", agent))
}

#[tauri::command]
async fn send_message_to_agent(agent: &str, message: serde_json::Value) -> Result<String, String> {
    println!("send_message_to_agent {} {:?}", agent, message);
    let mut processes = AGENT_PROCESSES.lock().await;
    let child = processes.get_mut(agent)
        .ok_or_else(|| format!("Agent {} not found", agent))?;

    if let Some(stdin) = child.stdin.as_mut() {
        let json_str = message.to_string();
        println!("write value {:?}", json_str);
        stdin.write_all(json_str.as_bytes()).await
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        stdin.write_all(b"\n").await
            .map_err(|e| format!("Failed to write newline to stdin: {}", e))?;
        stdin.flush().await.map_err(|e| format!("Failed to flush stdin: {}", e))?;
    }

    Ok(format!("Message sent to agent {}", agent))
}

#[tauri::command]
async fn start_listening(agent: &str, window: tauri::Window) -> Result<(), String> {
    let agent_name = agent.to_string();
    let window_clone = window.clone();
    let agent_name_clone = agent_name.clone();
    println!("start_listening {}", agent_name);
    
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
                        let _ = window_clone.emit("agent_message", serde_json::json!({
                            "agent": agent_name_clone,
                            "type": "disconnect",
                        }));
                        break;
                    },
                    Ok(n) => {
                        println!("Read {} bytes: {}", n, line.trim());
                        
                        let _ = window_clone.emit("agent_message", serde_json::json!({
                            "agent": agent_name_clone,
                            "type": "message",
                            "message": line.trim().to_string()
                        }));
                    },
                    Err(e) => {
                        println!("Error reading from stdout: {}", e);
                        let _ = window_clone.emit("agent_message", serde_json::json!({
                            "agent": agent_name_clone,
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
    
    Ok(())
}

#[tauri::command]
async fn stop_listening(agent: &str) -> Result<(), String> {
    let mut tasks = LISTENING_TASKS.lock().await;
    
    if let Some(handle) = tasks.remove(agent) {
        handle.abort();
        Ok(())
    } else {
        Err(format!("No active listener for agent {}", agent))
    }
}

pub fn get_invoke_handler() -> impl Fn(Invoke) -> bool + Send + Sync + 'static {
    tauri::generate_handler![initialize_acp, send_message_to_agent, start_listening, stop_listening]
}