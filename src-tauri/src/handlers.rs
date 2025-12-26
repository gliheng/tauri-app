use tauri::Emitter;
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
pub async fn acp_initialize(agent: &str) -> Result<String, String> {
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
pub async fn acp_send_message(agent: &str, message: serde_json::Value) -> Result<String, String> {
    let mut processes = AGENT_PROCESSES.lock().await;
    let child = processes.get_mut(agent)
        .ok_or_else(|| format!("Agent {} not found", agent))?;

    if let Some(stdin) = child.stdin.as_mut() {
        let json_str = message.to_string();
        stdin.write_all(json_str.as_bytes()).await
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        stdin.write_all(b"\n").await
            .map_err(|e| format!("Failed to write newline to stdin: {}", e))?;
        stdin.flush().await.map_err(|e| format!("Failed to flush stdin: {}", e))?;
    }

    Ok(format!("Message sent to agent {}", agent))
}

#[tauri::command]
pub async fn acp_start_listening(agent: &str, window: tauri::Window) -> Result<(), String> {
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
                        let _ = window_clone.emit("acp_message", serde_json::json!({
                            "agent": agent_name_clone,
                            "type": "disconnect",
                        }));
                        break;
                    },
                    Ok(n) => {
                        // println!("Read {} bytes: {}", n, line.trim());
                        
                        let event_data = serde_json::json!({
                            "agent": agent_name_clone,
                            "type": "message",
                            "message": line.trim().to_string()
                        });
                        
                        let _ = window_clone.emit("acp_message", event_data);
                    },
                    Err(e) => {
                        println!("Error reading from stdout: {}", e);
                        let _ = window_clone.emit("acp_message", serde_json::json!({
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
pub async fn acp_stop_listening(agent: &str) -> Result<(), String> {
    let mut tasks = LISTENING_TASKS.lock().await;
    
    if let Some(handle) = tasks.remove(agent) {
        handle.abort();
        Ok(())
    } else {
        Err(format!("No active listener for agent {}", agent))
    }
}

#[tauri::command]
pub async fn acp_dispose(agent: &str) -> Result<String, String> {
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
                    return Err(format!("Failed to kill agent process: {}", e));
                }
            }
        } else {
            return Err(format!("Agent {} not found", agent));
        }
    }
    
    Ok(format!("Agent {} disposed successfully", agent))
}