import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface AgentMessagePayload {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

export interface ACPServiceConfig {
  program: string;
  directory: string;
  mcpServers: {
    name: string;
    command: string;
    args: string[];
    env?: {
      name: string;
      value: string;
    }[];
  }[]
  onConnect?: () => void;
  onDisconnect?: () => void;
  onInvoke?: (method: string, params: any) => void;
}

export class ACPService {
  private program: string;
  private directory: string;
  private mcpServers: ACPServiceConfig['mcpServers'];
  private unlistenFn?: (() => void) | null;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private onInvoke?: (method: string, params: any) => void;
  private agentCapabilities?: Record<string, boolean>;
  private sessionId?: string;
  private pendingCalls: Record<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    promise: Promise<any>,
  }> = {};
  private msgId = 0;

  constructor(config: ACPServiceConfig) {
    this.program = config.program;
    this.directory = config.directory;
    this.mcpServers = config.mcpServers;
    this.onConnect = config.onConnect;
    this.onDisconnect = config.onDisconnect;
    this.onInvoke = config.onInvoke;
  }

  async initialize(): Promise<void> {
    await invoke("acp_initialize", { agent: this.program, directory: this.directory });
    this.startListening();
    const ret = await this.rpc("initialize", {
      "protocolVersion": 1,
      "clientCapabilities": {
        "fs": {
          "readTextFile": true,
          "writeTextFile": true
        },
        "terminal": true
      },
      "clientInfo": {
        "name": "raven",
        "title": "Raven",
        "version": "1.0.0"
      }
    });
    this.agentCapabilities = ret.agentCapabilities;
  }

  async startListening(): Promise<() => void> {
    try {
      await invoke("acp_start_listening", { agent: this.program });
      this.unlistenFn = await listen("acp_message", (event) => {
        const { agent, type, message } = event.payload as { agent: string; type: string; message: string };
        // Multiple page will receive this!
        if (agent === this.program) {
          console.log('Received acp_message', event.payload);
          if (type == 'connect') {
            this.onConnect?.();
          } else if (type == 'message') {
            const { id, result, error, method, params } = JSON.parse(message);
            if (typeof id == 'number') {
              if (error) {
                this.pendingCalls[id].reject(error);
              } else {
                this.pendingCalls[id].resolve(result);
              }
            } else if (method) {
              this.onInvoke?.(method, params);
            }
          } else if (type == 'disconnect') {
            this.onDisconnect?.();
          }
        }
      });
      
      return this.unlistenFn;
    } catch (err) {
      console.error("Failed to start listening:", err);
      throw new Error(`Failed to start listening: ${err}`);
    }
  }

  async stopListening(): Promise<void> {
    await invoke("acp_stop_listening", { agent: this.program });
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }
  }

  async rpc(method: string, message: Record<string, any>): Promise<any> {
    const id = this.msgId;
    this.pendingCalls[id] = Promise.withResolvers();
    const messagePayload: AgentMessagePayload = {
      jsonrpc: "2.0",
      id,
      method,
      params: message,
    };
    await invoke("acp_send_message", {
      agent: this.program,
      message: messagePayload,
    });
    console.log('Sent acp_message', messagePayload);
    this.msgId++;
    return this.pendingCalls[id].promise;
  }

  async send(method: string, message: Record<string, any>): Promise<any> {
    const id = this.msgId;
    const messagePayload: AgentMessagePayload = {
      jsonrpc: "2.0",
      id,
      method,
      params: message,
    };
    await invoke("acp_send_message", {
      agent: this.program,
      message: messagePayload,
    });
    this.msgId++;
  }

  async sessionNew(): Promise<any> {
    if (this.sessionId) {
      return {
        sessionId: this.sessionId,
      };
    }
    let ret = await this.rpc("session/new", {
      cwd: this.directory,
      mcpServers: this.mcpServers,
    });
    this.sessionId = ret.sessionId;
    return ret;
  }

  async sessionLoad(sessionId: string): Promise<any> {
    const ret = await this.rpc("session/load", {
      sessionId,
      cwd: this.directory,
      mcpServers: this.mcpServers,
    });
    this.sessionId = sessionId;
    return ret;
  }

  async sessionPrompt(message: {
    type: 'text',
    text: string,
  }): Promise<any> {
    return this.rpc("session/prompt", {
      prompt: [message],
      sessionId: this.sessionId,
    });
  }

  async dispose(): Promise<void> {
    // Stop listening first
    await this.stopListening();
    
    // Dispose the ACP process
    await invoke("acp_dispose", { agent: this.program });

    console.log(`ACP service for ${this.program} disposed successfully`);
  }
}