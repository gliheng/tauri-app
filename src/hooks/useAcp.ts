import { ref } from "vue";
import { ACPService, ACPMethod, ToolCallUpdate } from "@/services/acp";
import { getCodeAgentConfig } from "@/llm";
import { Agent } from "@/db-sqlite";
import PermissionModal from "@/components/AgentChat/PermissionModal.vue";
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';

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

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

export function useAcp({ chatId, agent, onInvoke }: {
  chatId: string,
  agent: Agent,
  onInvoke?: (method: string, params: any) => void,
}) {
  const overlay = useOverlay();
  const permissionModal = overlay.create(PermissionModal);
  const messages = ref<Message[]>([]);
  const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>("ready");
  const context = {
    toolCallMap: new Map<string, Message>(),
    availableCommands: [] as AvailableCommand[],
  };

  const { useCustomModel, ...modelConfig } = getCodeAgentConfig(agent.program!);
  const model = useCustomModel ? modelConfig : undefined;
  console.log('Creating ACP service for agent:', agent.program, 'chatId:', chatId, 'model:', model);
  const acpService = new ACPService({
    program: agent.program! + "::" + chatId, // Start a new process for each chat
    directory: agent.directory!,
    model,
    mcpServers: [],
    onConnect() {
      console.log('onConnect');
    },
    onDisconnect() {
      console.log('onDisconnect');
    },
    async onInvoke(method: string, params: any) {
      onInvoke?.(method, params);
      // console.log("Method", method, "invoked with params", params);
      if (method === ACPMethod.SessionUpdate) {
        const { update } = params as { update: any; sessionId: string };
        appendSessionUpdate(update, messages.value, context);
      } else if (method === ACPMethod.SessionRequestPermission) {
        appendSessionUpdate({
          sessionUpdate: 'tool_call',
          ...params.toolCall,
        }, messages.value, context);
        const optionId = await permissionModal.open({
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
          }
        }
      } else if (method === ACPMethod.TerminalCreate) {
        const { sessionId, command, args, env, cwd, outputByteLimit } = params as {
          sessionId: string;
          command: string;
          args?: string[];
          env?: { name: string; value: string; }[];
          cwd?: string;
          outputByteLimit?: number;
        };

        const result = await invoke<{ terminalId: string }>('acp_terminal_create', {
          sessionId,
          command,
          args,
          env,
          cwd: cwd ?? agent.directory!,
          outputByteLimit,
        });
        
        return result;
      } else if (method === ACPMethod.TerminalOutput) {
        const { sessionId, terminalId } = params as { sessionId: string; terminalId: string };
        
        const result = await invoke<{
          output: string;
          truncated: boolean;
          exitStatus?: { exitCode: number | null; signal: string | null };
        }>('acp_terminal_output', {
          sessionId,
          terminalId,
        });
        
        return result;
      } else if (method === ACPMethod.TerminalWaitForExit) {
        const { sessionId, terminalId } = params as { sessionId: string; terminalId: string };
        
        const result = await invoke<{ exitCode: number | null; signal: string | null }>(
          'acp_terminal_wait_for_exit',
          { sessionId, terminalId }
        );
        
        return result;
      } else if (method === ACPMethod.TerminalKill) {
        const { sessionId, terminalId } = params as { sessionId: string; terminalId: string };
        
        await invoke('acp_terminal_kill', { sessionId, terminalId });
        return;
      } else if (method === ACPMethod.TerminalRelease) {
        const { sessionId, terminalId } = params as { sessionId: string; terminalId: string };
        
        await invoke('acp_terminal_release', { sessionId, terminalId });
        return;
      } else if (method === ACPMethod.FsReadTextFile) {
        const { path, line, limit } = params as { path: string; line?: number; limit?: number };
        try {
          let content = await invoke<string>('read_file', { path });
          // If line and limit are specified, extract the specific lines
          if (line !== undefined) {
            const lines = content.split('\n');
            const startLine = line - 1; // Convert to 0-indexed
            const endLine = limit ? startLine + limit : lines.length;
            content = lines.slice(startLine, endLine).join('\n');
          }
          
          return {
            content,
          };
        } catch(e) {
          console.error(e);
          return {
            content: null,
          };
        }
      } else if (method === ACPMethod.FsWriteTextFile) {
        const { path, content } = params as { path: string; content: string };
        try {
          await invoke('write_file', { path, content });
        } catch(e) {
          console.error(e);
        }
        return null;
      }
    },
  });
  return {
    acpService,
    messages,
    status,
  };
}

function appendSessionUpdate(
  params: {
    sessionUpdate: string;
  } & Record<string, any>,
  messages: Message[],
  context: {
    toolCallMap: Map<string, Message>;
    availableCommands: AvailableCommand[];
  },
) {
  const { sessionUpdate, ...rest } = params;
  const lastMessage = messages[messages.length - 1];
  if (sessionUpdate == 'agent_message_chunk') {
    const content = rest.content;
    // Add message chunk
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
      messages.push({
        id: String(messages.length),
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
      messages.push({
        id: String(messages.length),
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
    messages.push({
      id: String(messages.length),
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
    // Handle new tool call creation
    const existingMsg = context.toolCallMap.get(rest.toolCallId);
    if (existingMsg) {
      // Update existing tool call message
      // Claude code sends two tool_call message! Bug?
      const part = existingMsg.parts[0] as ToolCallPart;
      Object.assign(part, rest);
    } else {
      const msg: Message = {
        id: String(messages.length),
        role: "assistant",
        content: rest.title,
        parts: [
          {
            type: 'tool_call',
            ...rest,
          } as ToolCallPart,
        ],
      };
      context.toolCallMap.set(rest.toolCallId, msg);
      messages.push(msg);
    }
  } else if (sessionUpdate == 'tool_call_update') {
    // Update previous tool call message
    const existingMsg = context.toolCallMap.get(rest.toolCallId);
    if (existingMsg) {
      // Update existing tool call message
      existingMsg.content = rest.title;
      const part = existingMsg.parts[0] as ToolCallPart;
      Object.assign(part, rest);
    }
  } else if (sessionUpdate == 'available_commands_update') {
    context.availableCommands = rest.availableCommands;
  } else if (sessionUpdate == 'user_message_chunk') {
    const content = rest.content;
    messages.push({
      id: String(messages.length),
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
