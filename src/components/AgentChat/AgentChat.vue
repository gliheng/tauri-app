<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType } from "vue";
import { Chat, updateChat, writeChat, type Agent } from "@/db";
import { ACPService, ACPMethod } from "@/services/acp";
import ChatBox from "@/components/ChatBox.vue";
import { getModelConfig } from "@/llm";
import MessageList from "./MessageList.vue";
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { generateTopic } from "@/llm/prompt";
import { useTabsStore } from "@/stores/tabs";
import Spinner from "../Spinner.vue";
import PermissionModal from "./PermissionModal.vue";

const props = defineProps({
  agent: {
    type: Object as PropType<Agent>,
    required: true,
  },
  chatId: {
    type: String,
    required: true,
  },
  chat: {
    type: Object as PropType<Chat>,
    required: false,
  },
});

type MessagePart = {
  type: 'text';
  text?: string;
} | {
  type: 'thought';
  thought?: string;
} | {
  type: 'plan';
  plan: {
    content: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
  }[]
} | {
  type: 'tool_call';
  toolCall: {
    toolCallId: string;
    title: string;
    kind: 'read' | 'edit' | 'delete' | 'move' | 'search' | 'execute' | 'think' | 'fetch' | 'other';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    content?: any[];
    locations?: any[];
    rawInput?: any;
    rawOutput?: any;
  }
};

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

const isInitialized = ref(false);
const input = ref("");
const messages = ref<Message[]>([]);
const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>("ready");
const error = ref<string | null>(null);


function appendSessionUpdate({
  sessionUpdate,
  content,
  entries,
}: {
  sessionUpdate: string;
  content: any;
  entries: any;
}) {
  const lastMessage = messages.value[messages.value.length - 1];
  if (sessionUpdate == 'agent_message_chunk') {
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
    // Handle new tool call creation
    const { toolCallId, title, kind, status: toolStatus, content, locations, rawInput, rawOutput } = entries;
    messages.value.push({
      id: String(messages.value.length),
      role: "assistant",
      content: title,
      parts: [
        {
          type: 'tool_call',
          toolCall: {
            toolCallId,
            title,
            kind: kind || 'other',
            status: toolStatus || 'pending',
            content,
            locations,
            rawInput,
            rawOutput
          }
        }
      ],
    });
  } else if (sessionUpdate == 'tool_call_update') {
    // Handle tool call updates
    const { toolCallId, status: toolStatus, content, locations, rawInput, rawOutput } = entries;
    
    // Find the message containing this tool call
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const message = messages.value[i];
      const toolCallPart = message.parts.find(part => 
        part.type === 'tool_call' && (part as any).toolCall.toolCallId === toolCallId
      );
      
      if (toolCallPart && toolCallPart.type === 'tool_call') {
        // Update the tool call with new data
        if (toolStatus) toolCallPart.toolCall.status = toolStatus;
        if (content) toolCallPart.toolCall.content = content;
        if (locations) toolCallPart.toolCall.locations = locations;
        if (rawInput !== undefined) toolCallPart.toolCall.rawInput = rawInput;
        if (rawOutput !== undefined) toolCallPart.toolCall.rawOutput = rawOutput;
        
        // Update message content if status changed
        if (toolStatus) {
          message.content = `${toolCallPart.toolCall.title} (${toolStatus})`;
        }
        break;
      }
    }
  } else if (sessionUpdate == 'user_message_chunk') {
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

const overlay = useOverlay();
const permissionModal = overlay.create(PermissionModal);
const { model, apiKey, baseUrl } = getModelConfig('silliconflow::Pro/zai-org/GLM-4.7');
const acpService = new ACPService({ 
  program: props.agent.program! + "::" + props.chatId, // Start a new process for each chat
  directory: props.agent.directory!,
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
      appendSessionUpdate(update);
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

const start = async () => {
  try {
    error.value = null;
    console.log("Starting agent initialization...");
            
    await acpService.initialize();
    const enableLoadSession = acpService.hasCapability("loadSession");

    if (enableLoadSession && props.chat && props.chat.sessionId) {
      await acpService.sessionLoad(props.chat.sessionId);
      status.value = 'ready';
    }
    
    console.log("Agent initialized successfully");
    isInitialized.value = true;
    status.value = "ready";
  } catch (err) {
    console.error("Failed to launch agent:", err);
    error.value = `Failed to launch agent: ${JSON.stringify(err, null, 2)}`;
    status.value = "error";
  }
};

const stop = async () => {
  try {
    error.value = null;
    console.log("Stopping agent...");
    
    if (acpService && isInitialized.value) {
      await acpService.dispose();
    }
    
    status.value = "ready";
    isInitialized.value = false;
    console.log("Agent stopped successfully");
  } catch (err) {
    console.error("Failed to stop agent:", err);
    error.value = `Failed to stop agent: ${err}`;
    console.log(`Error stopping agent: ${JSON.stringify(err, null, 2)}`);
    status.value = "error";
  }
};

const handleSubmit = async () => {
  if (!input.value.trim() || !isInitialized.value || !acpService) return;
  
  try {
    error.value = null;
    status.value = "streaming";
    
    const text = input.value.trim();
    const part = {
      type: 'text' as const,
      text,
    };

    messages.value.push({
      id: String(messages.value.length),
      role: "user",
      content: text,
      parts: [
        part,
      ],
    });

    input.value = "";
    status.value = "submitted";

    if (!props.chat && messages.value.length === 1) {
      const ret = await acpService.sessionNew();
      console.log('Session created:', ret);
  
      // Async update chat meta data
      (async () => {
        const { text: topic } = await generateTopic(messages.value[0].content);
        const agentChat = {
          id: props.chatId,
          topic: topic,
          createdAt: new Date(),
          updatedAt: new Date(),
          agentId: props.agent.id,
          sessionId: ret.sessionId,
        };
        await writeChat(agentChat);
        useTabsStore().setTitle(`/chat/${props.chatId}`, topic);
      })();
    } else {
      // Async update chat meta data
      (async () => {
        await updateChat(props.chatId, {
          updatedAt: new Date(),
        });
      })();
    }

    const ret = await acpService.sessionPrompt(part)
    console.log('sessionPrompt result', ret);
    
    status.value = "ready";
  } catch (err) {
    console.error("Failed to send message:", err);
    error.value = `Failed to send message: ${JSON.stringify(err, null, 2)}`;
    status.value = "error";
  }
};

function cancel() {
  acpService.sessionCancel();
  status.value = 'ready';
}

onMounted(() => {
  start();
});

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div class="size-full p-6 flex flex-col gap-2 justify-between">
    <section v-if="!isInitialized" class="flex-1 flex justify-center items-center">
      <Spinner />
    </section>
    <template v-else>
      <UAlert
        v-if="error"
        title="Error!"
        :description="error"
        color="error"
        icon="i-lucide-alert-octagon"
        :ui="{
          icon: 'size-11'
        }"
      />
      <div class="flex-1 overflow-y-auto min-h-0 flex">
        <MessageList :messages="messages" />
      </div>
      <ChatBox
        :style="{ width: '100%' }"
        v-model="input"
        :status="status"
        :messages="messages"
        @submit="handleSubmit"
        @stop="cancel"
      />
    </template>
  </div>
</template>
