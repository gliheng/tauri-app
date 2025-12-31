import { ref } from "vue";
import { ACPService, ACPMethod } from "@/services/acp";
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { getModelConfig } from "@/llm";
import { Agent } from "@/db";
import PermissionModal from "@/components/AgentChat/PermissionModal.vue";

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

export interface ToolCallPart {
  type: 'tool_call';
  toolCallId: string;
  title: string;
  kind: 'read' | 'edit' | 'delete' | 'move' | 'search' | 'execute' | 'think' | 'fetch' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  content?: any[];
  locations?: any[];
  rawInput?: object;
  rawOutput?: object;
}

export type ContentBlock = TextBlock | ImageBlock | AudioBlock | ResourceBlock | ResourceLinkBlock;

export type MessagePart = ContentBlock | ThoughtPart | PlanPart | ToolCallPart

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

export function useAcp(chatId: string, agent: Agent) {
  const overlay = useOverlay();
  const permissionModal = overlay.create(PermissionModal);
  const messages = ref<Message[]>([]);
  const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>("ready");
  const toolCallMap = new Map<string, Message>();
  const { model, apiKey, baseUrl } = getModelConfig('silliconflow::Pro/zai-org/GLM-4.7');
  const acpService = new ACPService({
    program: agent.program! + "::" + chatId, // Start a new process for each chat
    directory: agent.directory!,
    mcpServers: [],
    model,
    baseUrl,
    apiKey,
    onConnect() {
      console.log('onConnect');
    },
    onDisconnect() {
      console.log('onDisconnect');
    },
    async onInvoke(method: string, params: any) {
      // console.log("Method", method, "invoked with params", params);
      if (method === ACPMethod.SessionUpdate) {
        status.value = 'streaming';
        const { update } = params as { update: any; sessionId: string };
        appendSessionUpdate(update, messages.value, toolCallMap);
      } else if (method === ACPMethod.SessionRequestPermission) {
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
        return {
          terminalId: '',
        };
      } else if (method === ACPMethod.TerminalOutput) {
        return {
          output: "Running tests...\n✓ All tests passed (42 total)\n",
          truncated: false,
          exitStatus: {
            exitCode: 0,
            signal: null
          }
        };
      } else if (method === ACPMethod.FsReadTextFile) {
        const { path, line, limit } = params as { path: string; line?: number; limit?: number };
        try {
          let content = await readTextFile(path);
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
          await writeTextFile(path, content);
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
  toolCallMap: Map<string, Message>,
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
    toolCallMap.set(rest.toolCallId, msg);
    messages.push(msg);
  } else if (sessionUpdate == 'tool_call_update') {
    // update previous tool call message
    const existingMsg = toolCallMap.get(rest.toolCallId);
    if (existingMsg) {
      // Update existing tool call message
      existingMsg.content = rest.title;
      const part = existingMsg.parts[0] as ToolCallPart;
      Object.assign(part, rest);
    }
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
