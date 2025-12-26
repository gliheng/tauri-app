import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Ref } from "vue";

export interface Message {
  role: string;
  content: string;
}

export interface AgentMessagePayload {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

export const initialize = async (program: string) => {
  // Initialize the agent process
  const result = await invoke("initialize_acp", { agent: program });
  
  // Send initialization message and wait for OK response
  const initMessage: AgentMessagePayload = {
    "jsonrpc": "2.0",
    "id": 0,
    "method": "initialize",
    "params": {
      "protocolVersion": 1,
      "clientCapabilities": {
        "fs": {
          "readTextFile": true,
          "writeTextFile": true
        },
        "terminal": true
      },
      "clientInfo": {
        "name": "my-client",
        "title": "My Client",
        "version": "1.0.0"
      }
    }
  };
  
  await invoke("send_message_to_agent", { agent: program, message: initMessage });
  return result;
};

export const startListening = async (
  program: string, 
  messages: Message[],
  debug: Ref<string>
) => {
  try {
    await invoke("start_listening", { agent: program });
    debug.value += "\nStarted listening for messages...";
    
    const unlistenAgentMessage = await listen("agent_message", (event) => {
      console.log("agent_message", event);
      const { agent, message } = event.payload as { agent: string; message: string };
      if (agent === program) {
        debug.value += `\nReceived message: ${message}`;
        try {
          const parsedMessage = JSON.parse(message);
          messages.push({
            role: "assistant",
            content: JSON.stringify(parsedMessage, null, 2)
          });
        } catch {
          messages.push({
            role: "assistant", 
            content: message
          });
        }
      }
    });
    
    return unlistenAgentMessage;
  } catch (err) {
    console.error("Failed to start listening:", err);
    throw new Error(`Failed to start listening: ${err}`);
  }
};

export const sendMessage = async (
  program: string,
  userMessage: string,
  debug: Ref<string>
) => {
  try {
    debug.value += `\nSending message: ${userMessage}`;
    
    const messagePayload: AgentMessagePayload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "chat",
      params: {
        message: userMessage
      }
    };
    
    await invoke("send_message_to_agent", { 
      agent: program, 
      message: messagePayload 
    });
    
    debug.value += "\nMessage sent successfully";
  } catch (err) {
    console.error("Failed to send message:", err);
    throw new Error(`Failed to send message: ${err}`);
  }
};

export const stopListening = async (program: string) => {
  try {
    await invoke("stop_listening", { agent: program });
  } catch (err) {
    console.error("Failed to stop listening:", err);
    throw new Error(`Failed to stop listening: ${err}`);
  }
};