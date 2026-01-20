import { Ref } from "vue";
import * as acp from "@agentclientprotocol/sdk";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Agent } from "@/db-sqlite";

export type Role = 'user' | 'assistant';

export interface BlockBase {
  annotations?: Record<string, any>;
}

export interface TextBlock extends BlockBase {
  type: 'text';
  text?: string;
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  data: string;
  mimeType: string;
  uri?: string;
}

export interface AudioBlock extends BlockBase {
  type: 'audio';
  data: string;
  mimeType: string;
}

export interface ResourceBlock extends BlockBase {
  type: 'resource';
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
}

export interface ResourceLinkBlock extends BlockBase {
  type: 'resource_link';
  uri: string;
  name: string;
  mimeType?: string;
  title?: string;
  description?: string;
  size?: number;
}

export interface PlanTask {
  content: string;
  priority?: "high" | "medium" | "low";
  status: "completed" | "in_progress" | "pending";
}

export interface PlanPart {
  type: 'plan';
  plan: PlanTask[];
}

export interface ThoughtPart {
  type: 'thought';
  thought?: string;
}

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

export interface ToolCallPart extends ToolCallUpdate {
  type: 'tool_call';
}

export interface AvailableCommandInput {
  hint: string;
}

export interface AvailableCommand {
  name: string;
  description: string;
  input?: AvailableCommandInput;
}

export type ContentBlock = TextBlock | ImageBlock | AudioBlock | ResourceBlock | ResourceLinkBlock;

export type MessagePart = ContentBlock | ThoughtPart | PlanPart | ToolCallPart

export type Status = 'submitted' | 'streaming' | 'ready' | 'error';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

export interface Mode {
  id: string;
  name: string;
  description?: string;
}

export interface Model {
  name: string;
  modelId: string;
  description?: string | null;
  meta?: {
    contextLimit: number;
  };
}

interface TauriStreamOptions {
  program: string;
  model?: {
    model: string;
    baseUrl: string;
    apiKey: string;
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export async function createTauriAcpConnection(
  options: TauriStreamOptions,
  toClient: (agent: acp.Agent) => acp.Client
): Promise<{
  connection: acp.ClientSideConnection;
  dispose: () => Promise<void>;
}> {
  const { program, model, onConnect, onDisconnect } = options;
  let unlisten: UnlistenFn | null = null;
  
  const ret = await invoke<{ code: number, message?: string }>("acp_initialize", {
    agent: program,
    settings: {
      baseUrl: model?.baseUrl ?? "",
      apiKey: model?.apiKey ?? "",
      model: model?.model ?? "",
    },
  });

  if (ret.code != 0) {
    throw new Error(ret.message ?? "Unknown error");
  }

  const dispose = async () => {
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
    await invoke("acp_stop_listening", { agent: program });
    await invoke("acp_dispose", { agent: program });
  };

  const input = new WritableStream<Uint8Array>({
    async write(chunk: Uint8Array) {
      const text = new TextDecoder().decode(chunk);
      const message = JSON.parse(text);
      console.log('Sending to Tauri:', message);
      await invoke("acp_send_message", {
        agent: program,
        message,
      });
    },
  });

  const output = new ReadableStream<Uint8Array>({
    async start(controller) {
      await invoke("acp_start_listening", { agent: program });
      
      unlisten = await listen("acp_message::" + program, (event) => {
        const { type, message } = event.payload as { 
          agent: string; 
          type: string; 
          message: string 
        };
        
        if (type === 'connect') {
          console.debug('ACP connected', program);
          onConnect?.();
        } else if (type === 'message') {
          console.debug('Received from Tauri:', message);
          const encoded = new TextEncoder().encode(message + '\n');
          controller.enqueue(encoded);
        } else if (type === 'disconnect') {
          console.debug('ACP disconnected', program);
          onDisconnect?.();
          controller.close();
        }
      });
    },
    
    async cancel() {
      if (unlisten) {
        unlisten();
        unlisten = null;
      }
      await invoke("acp_stop_listening", { agent: program });
    },
  });

  const stream = acp.ndJsonStream(input, output);
  const connection = new acp.ClientSideConnection(toClient, stream);    

  return { connection, dispose };
}


export class TauriACPClient implements acp.Client {
  public connection!: acp.ClientSideConnection;
  private toolCallMap = new Map<string, Message>();
  private initializeResponse?: acp.InitializeResponse;
  private onDispose?: () => void;

  constructor(
    private state: {
      messages: Ref<Message[]>;
      status: Ref<Status>;
      currentModeId: Ref<string>;
      availableModes: Ref<Mode[]>;
      currentModelId: Ref<string>;
      availableModels: Ref<Model[]>;
      availableCommands: Ref<AvailableCommand[]>;
    },
    private agent: Agent,
    private config: {
      programId: string;
      model?: {
        model: string;
        baseUrl: string;
        apiKey: string;
      };
      onConnect?: () => void;
      onDisconnect?: () => void;
    },
    private openPermission: (options: { options: any[] }) => Promise<string | null>,
    private onInvokeCallback?: (method: string, params: any) => void,
  ) {}

  async requestPermission(
    params: acp.RequestPermissionRequest,
  ): Promise<acp.RequestPermissionResponse> {
    this.onInvokeCallback?.('session/request_permission', params);
    this.appendSessionUpdate({
      sessionUpdate: 'tool_call',
      ...params.toolCall,
    });
    
    const optionId = await this.openPermission({
      options: params.options,
    });
    
    if (optionId) {
      return {
        outcome: {
          outcome: "selected" as const,
          optionId,
        }
      };
    } else {
      return {
        outcome: {
          outcome: "cancelled",
        },
      };
    }
  }

  async sessionUpdate(params: acp.SessionNotification): Promise<void> {
    this.onInvokeCallback?.('session/update', params);
    this.appendSessionUpdate(params.update);
  }

  async readTextFile(
    params: acp.ReadTextFileRequest,
  ): Promise<acp.ReadTextFileResponse> {
    this.onInvokeCallback?.('fs/read_text_file', params);
    const { path, line, limit } = params;
    try {
      let content = await invoke<string>('read_file', { path });
      if (line !== undefined && line !== null) {
        const lines = content.split('\n');
        const startLine = line - 1;
        const endLine = limit ? startLine + limit : lines.length;
        content = lines.slice(startLine, endLine).join('\n');
      }
      return { content };
    } catch(e) {
      console.error(e);
      return { content: null as any };
    }
  }

  async writeTextFile(
    params: acp.WriteTextFileRequest,
  ): Promise<acp.WriteTextFileResponse> {
    this.onInvokeCallback?.('fs/write_text_file', params);
    const { path, content } = params;
    try {
      await invoke('write_file', { path, content });
    } catch(e) {
      console.error(e);
    }
    return {};
  }

  async createTerminal(
    params: acp.CreateTerminalRequest,
  ): Promise<acp.CreateTerminalResponse> {
    this.onInvokeCallback?.('terminal/create', params);
    const { sessionId, command, args, env, cwd, outputByteLimit } = params;
    
    const result = await invoke<{ terminalId: string }>('acp_terminal_create', {
      sessionId,
      command,
      args,
      env,
      cwd: cwd ?? this.agent.directory!,
      outputByteLimit,
    });
    
    return result;
  }

  async getTerminalOutput(
    params: acp.TerminalOutputRequest,
  ): Promise<acp.TerminalOutputResponse> {
    this.onInvokeCallback?.('terminal/output', params);
    const { sessionId, terminalId } = params;
    
    const result = await invoke<{
      output: string;
      truncated: boolean;
      exitStatus?: { exitCode: number | null; signal: string | null };
    }>('acp_terminal_output', {
      sessionId,
      terminalId,
    });
    
    return result;
  }

  async waitForTerminalExit(
    params: acp.WaitForTerminalExitRequest,
  ): Promise<acp.WaitForTerminalExitResponse> {
    this.onInvokeCallback?.('terminal/wait_for_exit', params);
    const { sessionId, terminalId } = params;
    
    const result = await invoke<{ exitCode: number | null; signal: string | null }>(
      'acp_terminal_wait_for_exit',
      { sessionId, terminalId }
    );
    
    return result;
  }

  async killTerminal(
    params: acp.KillTerminalCommandRequest,
  ): Promise<acp.KillTerminalCommandResponse> {
    this.onInvokeCallback?.('terminal/kill', params);
    const { sessionId, terminalId } = params;
    
    await invoke('acp_terminal_kill', { sessionId, terminalId });
    return {};
  }

  async releaseTerminal(
    params: acp.ReleaseTerminalRequest,
  ): Promise<acp.ReleaseTerminalResponse> {
    this.onInvokeCallback?.('terminal/release', params);
    const { sessionId, terminalId } = params;
    
    await invoke('acp_terminal_release', { sessionId, terminalId });
    return {};
  }

  // Service methods
  async initialize() {
    const { connection, dispose } = await createTauriAcpConnection({
      program: this.config.programId,
      model: this.config.model,
      onConnect: this.config.onConnect,
      onDisconnect: this.config.onDisconnect,
    }, (agent) => this);
    this.connection = connection;
    this.onDispose = dispose;

    const result = await this.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        fs: {
          readTextFile: true,
          writeTextFile: true,
        },
        terminal: true,
      },
      clientInfo: {
        name: "raven",
        title: "Raven",
        version: "1.0.0",
      },
    });

    this.initializeResponse = result;
    
    return result;
  }

  async sessionNew() {
    const result = await this.connection.newSession({
      cwd: this.agent.directory!,
      mcpServers: [],
    });
    
    if ((result as any).models) {
      this.state.currentModelId.value = (result as any).models.currentModelId;
      this.state.availableModels.value = (result as any).models.availableModels as Model[];
    }
    if ((result as any).modes) {
      this.state.currentModeId.value = (result as any).modes.currentModeId;
      this.state.availableModes.value = (result as any).modes.availableModes as Mode[];
    }
    
    return result;
  }

  async sessionLoad(sessionId: string) {
    const result = await this.connection.loadSession({
      sessionId,
      cwd: this.agent.directory!,
      mcpServers: [],
    });
    
    if ((result as any).models) {
      this.state.currentModelId.value = (result as any).models.currentModelId;
      this.state.availableModels.value = (result as any).models.availableModels as Model[];
    }
    if ((result as any).modes) {
      this.state.currentModeId.value = (result as any).modes.currentModeId;
      this.state.availableModes.value = (result as any).modes.availableModes as Mode[];
    }
    
    return result;
  }

  async sessionPrompt(message: { type: 'text'; text: string }) {
    return this.connection.prompt({
      sessionId: '',
      prompt: [message],
    });
  }

  async sessionCancel() {
    return this.connection.cancel({
      sessionId: '',
    });
  }

  async sessionSetMode(modeId: string) {
    return (this.connection as any).extMethod('session/set_mode', {
      sessionId: '',
      modeId,
    });
  }

  async dispose() {
    this.onDispose?.();
  }

  hasCapability(capability: string): boolean {
    if (!this.initializeResponse?.agentCapabilities) return false;
    
    const agentCapabilities = this.initializeResponse.agentCapabilities;
    
    // Check top-level capabilities like loadSession
    if (capability in agentCapabilities) {
      return Boolean(agentCapabilities[capability as keyof acp.AgentCapabilities]);
    }
    
    // Check nested promptCapabilities
    if (agentCapabilities.promptCapabilities && capability in agentCapabilities.promptCapabilities) {
      return Boolean(agentCapabilities.promptCapabilities[capability as keyof acp.PromptCapabilities]);
    }
    
    return false;
  }

  getInitializeResult() {
    return this.initializeResponse;
  }

  getAgentInfo() {
    return this.initializeResponse?.agentInfo;
  }

  getAuthMethods() {
    return this.initializeResponse?.authMethods;
  }

  private appendSessionUpdate(
    params: {
      sessionUpdate: string;
    } & Record<string, any>,
  ) {
    const { messages, currentModeId, availableCommands } = this.state;
    const { sessionUpdate, ...rest } = params;
    const lastMessage = messages.value[messages.value.length - 1];
    
    if (sessionUpdate == 'agent_message_chunk') {
      const content = rest.content;
      if (lastMessage?.role === 'assistant') {
        const lastPart = lastMessage.parts![lastMessage.parts!.length - 1];
        if (lastPart.type == 'text' && content.text) {
          lastPart.text += content.text;
        } else {
          lastMessage.parts!.push({
            type: 'text',
            text: content.text,
          });
        }
        lastMessage.content += content.text;
      } else {
        messages.value.push({
          id: String(messages.value.length),
          role: "assistant",
          content: content.text,
          parts: [
            {
              type: 'text',
              text: content.text,
            }
          ],
        });
      }
    } else if (sessionUpdate == 'agent_thought_chunk') {
      const content = rest.content;
      if (lastMessage?.role === 'assistant') {
        const lastPart = lastMessage.parts![lastMessage.parts!.length - 1];
        if (lastPart.type == 'thought' && content.text) {
          lastPart.thought += content.text;
        } else {
          lastMessage.parts!.push({
            type: 'thought',
            thought: content.text,
          });
        }
        lastMessage.content += content.text;
      } else {
        messages.value.push({
          id: String(messages.value.length),
          role: "assistant",
          content: content.text,
          parts: [
            {
              type: 'thought',
              thought: content.text,
            }
          ],
        });
      }
    } else if (sessionUpdate == 'plan') {
      const entries = rest.entries;
      messages.value.push({
        id: String(messages.value.length),
        role: "assistant",
        content: JSON.stringify(entries),
        parts: [
          {
            type: 'plan',
            plan: entries,
          }
        ],
      });
    } else if (sessionUpdate == 'tool_call') {
      const existingMsg = this.toolCallMap.get(rest.toolCallId);
      if (existingMsg) {
        const part = existingMsg.parts[0] as ToolCallPart;
        Object.assign(part, rest);
      } else {
        const msg: Message = {
          id: String(messages.value.length),
          role: "assistant",
          content: rest.title,
          parts: [
            {
              type: 'tool_call',
              ...rest,
            } as ToolCallPart,
          ],
        };
        this.toolCallMap.set(rest.toolCallId, msg);
        messages.value.push(msg);
      }
    } else if (sessionUpdate == 'tool_call_update') {
      const existingMsg = this.toolCallMap.get(rest.toolCallId);
      if (existingMsg) {
        existingMsg.content = rest.title;
        const part = existingMsg.parts[0] as ToolCallPart;
        Object.assign(part, rest);
      }
    } else if (sessionUpdate == 'available_commands_update') {
      availableCommands.value = rest.availableCommands;
    } else if (sessionUpdate == 'current_mode_update') {
      currentModeId.value = rest.modeId;
    } else if (sessionUpdate == 'user_message_chunk') {
      const content = rest.content;
      messages.value.push({
        id: String(messages.value.length),
        role: "user",
        content: content.text,
        parts: [
          {
            type: 'text',
            text: content.text,
          }
        ],
      });
    }
  }
}
