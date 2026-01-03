import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface AgentMessagePayload {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

export enum ACPMethod {
  SessionUpdate = 'session/update',
  SessionPrompt = 'session/prompt',
  SessionCancel = 'session/cancel',
  SessionRequestPermission = 'session/request_permission',
  FsReadTextFile = 'fs/read_text_file',
  FsWriteTextFile = 'fs/write_text_file',
  TerminalCreate = 'terminal/create',
  TerminalWaitForExit = 'terminal/wait_for_exit',
  TerminalKill = 'terminal/kill',
  TerminalOutput = 'terminal/output',
  TerminalRelease = 'terminal/release',
}

export type StopReason = 'end_turn' | 'max_tokens' | 'max_turn_requests' | 'refusal' | 'cancelled';

export interface ToolCallUpdate {
  toolCallId: string;
  title: string;
  kind: 'read' | 'edit' | 'delete' | 'move' | 'search' | 'execute' | 'think' | 'fetch' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  content?: any[];
  locations?: any[];
  rawInput?: object;
  rawOutput?: object;  
}

export type ACPMethodDefinitions = {
  [ACPMethod.SessionPrompt]: {
    params: { sessionId: string; message: string };
    return: {
      stopReason: StopReason;
    };
  };
  [ACPMethod.SessionUpdate]: {
      params: {
        update: {
          sessionUpdate:
           | 'plan'
           | 'tool_call'
           | 'tool_call_update'
           | 'agent_message_chunk'
           | 'agent_thought_chunk'
           | 'available_commands_update';
          [key: string]: any;
        };
        sessionId: string;
      };
    return: void;
  };
  [ACPMethod.SessionCancel]: {
    params: { sessionId: string; };
    return: void;
  };
  [ACPMethod.SessionRequestPermission]: {
    params: {
      sessionId: string;
      toolCall: ToolCallUpdate;
      options: {
        optionId: string;
        name: string;
        kind: 'allow_once' | 'allow_always' | 'reject_once' | 'reject_always';
      }[];
    };
    return: {
      outcome: {
        outcome: 'cancelled' | 'selected';
        optionId?: string;
      };
    };
  };
  [ACPMethod.FsReadTextFile]: {
    params: { path: string; line?: number; limit?: number };
    return: { content: string };
  };
  [ACPMethod.FsWriteTextFile]: {
    params: { path: string; content: string };
    return: null;
  };
  [ACPMethod.TerminalCreate]: {
    params: {
      sessionId: string;
      command: string;
      args?: string[];
      env?: { name: string; value: string; }[];
      cwd?: string;
      outputByteLimit?: number;
    };
    return: { terminalId: string };
  };
  [ACPMethod.TerminalWaitForExit]: {
    params: { sessionId: string; terminalId: string };
    return: { exitCode: number | null; signal: string | null };
  };
  [ACPMethod.TerminalKill]: {
    params: { sessionId: string; terminalId: string };
    return: void;
  };
  [ACPMethod.TerminalOutput]: {
    params: { sessionId: string; terminalId: string };
    return: {
      output: string;
      truncated: boolean;
      exitStatus?: { exitCode: number | null; signal: string | null };
    };
  };
  [ACPMethod.TerminalRelease]: {
    params: { sessionId: string; terminalId: string };
    return: void;
  };
};

export interface AgentInfo {
  name: string;
  title: string;
  version: string;
}

export interface AuthMethod {
  id: string;
  name: string;
  description: string;
}

export interface Mode {
  id: string;
  name: string;
  description: string;
}

export interface PromptCapabilities {
  image: boolean;
  audio: boolean;
  embeddedContext: boolean;
}

export interface AgentCapabilities {
  loadSession: boolean;
  promptCapabilities: PromptCapabilities;
}

export interface InitializeResult {
  protocolVersion: number;
  agentInfo: AgentInfo;
  authMethods: AuthMethod[];
  modes: {
    currentModeId: string;
    availableModes: Mode[];
  };
  agentCapabilities: AgentCapabilities;
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
  }[];
  model?: {
    model: string;
    baseUrl: string;
    apiKey: string;
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onInvoke?: (method: string, params: any) => Promise<any>;
}

export class ACPService {
  private unlistenFn?: (() => void) | null;
  private sessionId?: string;
  private initializeResult?: InitializeResult;
  private pendingCalls: Record<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    promise: Promise<any>,
  }> = {};
  private msgId = 0;

  constructor(private config: ACPServiceConfig) {}

  async initialize(): Promise<void> {
    await invoke("acp_initialize", {
      agent: this.config.program,
      settings: this.config.model,
    });
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
    }) as InitializeResult;
    this.initializeResult = ret;
  }

  async startListening(): Promise<() => void> {
    try {
      await invoke("acp_start_listening", { agent: this.config.program });
      this.unlistenFn = await listen("acp_message::" + this.config.program, async (event) => {
        const { type, message } = event.payload as { agent: string; type: string; message: string };
        if (type == 'connect') {
          console.debug('ACP connected', this.config.program);
          this.config.onConnect?.();
        } else if (type == 'message') {
          console.debug('Received acp_message', JSON.parse(message));
          const { id, result, error, method, params } = JSON.parse(message);
          if (method) {
            const ret = await this.config.onInvoke?.(method, params);
            if (ret) {
              this.send({
                id,
                result: ret,
              });
            }
          } else if (typeof id == 'number') {
            if (error) {
              this.pendingCalls[id].reject(error);
            } else {
              this.pendingCalls[id].resolve(result);
            }
          }
        } else if (type == 'disconnect') {
          console.debug('ACP disconnected', this.config.program);
          this.config.onDisconnect?.();
        }
      });
      
      return this.unlistenFn;
    } catch (err) {
      console.error("Failed to start listening:", err);
      throw new Error(`Failed to start listening: ${err}`);
    }
  }

  async stopListening(): Promise<void> {
    await invoke("acp_stop_listening", { agent: this.config.program });
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }
  }

  async rpc(method: string, message: Record<string, any>): Promise<any> {
    const id = this.msgId;
    let resolver: { resolve: (value: any) => void; reject: (reason: any) => void; };
    const promise = new Promise<any>((resolve, reject) => {
      resolver = { resolve, reject };
    });
    this.pendingCalls[id] = { resolve: resolver!.resolve, reject: resolver!.reject, promise };
    const messagePayload: AgentMessagePayload = {
      jsonrpc: "2.0",
      id,
      method,
      params: message,
    };
    await invoke("acp_send_message", {
      agent: this.config.program,
      message: messagePayload,
    });
    console.log('Sent acp_message', messagePayload);
    this.msgId++;
    return this.pendingCalls[id].promise;
  }

  async send(payload: Record<string, any>): Promise<any> {
    await invoke("acp_send_message", {
      agent: this.config.program,
      message: {
        jsonrpc: "2.0",
        ...payload,
      },
    });
  }

  async sessionNew(): Promise<any> {
    if (this.sessionId) {
      return {
        sessionId: this.sessionId,
      };
    }
    let ret = await this.rpc("session/new", {
      cwd: this.config.directory,
      mcpServers: this.config.mcpServers,
    });
    this.sessionId = ret.sessionId;
    return ret;
  }

  async sessionLoad(sessionId: string): Promise<any> {
    const ret = await this.rpc("session/load", {
      sessionId,
      cwd: this.config.directory,
      mcpServers: this.config.mcpServers,
    });
    this.sessionId = sessionId;
    return ret;
  }

  async sessionPrompt(message: {
    type: 'text',
    text: string,
  }): Promise<{
    stopReason: string;
  }> {
    return this.rpc("session/prompt", {
      prompt: [message],
      sessionId: this.sessionId,
    });
  }

  async sessionCancel(): Promise<void> {
    return this.rpc("session/cancel", {
      sessionId: this.sessionId,
    });
  }

  async dispose(): Promise<void> {
    // Stop listening first
    await this.stopListening();
    
    // Dispose the ACP process
    await invoke("acp_dispose", { agent: this.config.program });

    console.log(`ACP service for ${this.config.program} disposed successfully`);
  }

  hasCapability(capability: string): boolean {
    if (!this.initializeResult?.agentCapabilities) return false;
    
    const agentCapabilities = this.initializeResult.agentCapabilities;
    
    // Check top-level capabilities like loadSession
    if (capability in agentCapabilities) {
      return (agentCapabilities as any)[capability];
    }
    
    // Check nested promptCapabilities
    if (agentCapabilities.promptCapabilities && capability in agentCapabilities.promptCapabilities) {
      return agentCapabilities.promptCapabilities[capability as keyof PromptCapabilities];
    }
    
    return false;
  }

  getInitializeResult(): InitializeResult | undefined {
    return this.initializeResult;
  }

  getAgentInfo(): AgentInfo | undefined {
    return this.initializeResult?.agentInfo;
  }

  getAuthMethods(): AuthMethod[] {
    return this.initializeResult?.authMethods ?? [];
  }

  getModes(): {
    currentModeId: string;
    availableModes: Mode[];
  } | undefined {
    return this.initializeResult?.modes;
  }
}