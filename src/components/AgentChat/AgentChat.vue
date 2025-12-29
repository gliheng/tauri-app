<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType, watch } from "vue";
import { getChat, writeChat, updateAgent, type Agent } from "@/db";
import { ACPService } from "@/services/acp";
import ChatBox from "@/components/ChatBox.vue";
import { getModelConfig } from "@/llm";
import { useSidebarStore } from "@/stores/sidebar";
import { useTabsStore } from "@/stores/tabs";
import MessageList from "./MessageList.vue";
import { Message } from "ai";
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const props = defineProps({
  agent: {
    type: Object as PropType<Agent>,
    required: true,
  },
  chatId: {
    type: String,
    required: true,
  },
});

const name = ref(props.agent.name);
const icon = ref(props.agent.icon);
const isInitialized = ref(false);
const input = ref("");
const messages = ref<Message[]>([]);
const status = ref<'loading' | 'submitted' | 'streaming' | 'ready' | 'error'>("ready");
const error = ref<string | null>(null);

const { model, apiKey, baseUrl } = getModelConfig();
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
  async onInvoke(method, params) {
    console.log("Method", method, "invoked with params", params);
    if (method == 'session/update') {
      const { update } = params;
      const lastMessage = messages.value[messages.value.length - 1];
      const { sessionUpdate } = update;
      if (sessionUpdate == 'agent_message_chunk') {
        // Add message chunk
        if (lastMessage.role === 'assistant') {
          const lastPart = lastMessage.parts![lastMessage.parts!.length - 1];
          if (lastPart.type == 'text' && update.content.type == 'text') {
            lastPart.text += update.content.text;
          } else {
            lastMessage.parts!.push({
              type: 'text',
              text: update.content.text,
            });
          }
        } else {
          messages.value.push({
            id: String(messages.value.length),
            role: "assistant",
            content: '',
            parts: [
              {
                type: 'text',
                text: update.content.text,
              }
            ],
          });
        }
      } else if (sessionUpdate == 'plan') {
      } else if (sessionUpdate == 'tool_call') {
      } else if (sessionUpdate == 'user_message_chunk') {
        messages.value.push({
          id: String(messages.value.length),
          role: "user",
          content: '',
          parts: [
            {
              type: 'text',
              text: update.content.text,
            }
          ],
        });
      }
    } else if (method == 'fs/read_text_file') {
      const { path, line, limit } = params; // line and limit are optional
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
    } else if (method == 'fs/write_text_file') {
      const { path, content } = params;
      await writeTextFile(path, content);
      return null;
    }
  },
});

let agentChat = (await getChat(props.chatId))?.chat;

const start = async () => {
  try {
    error.value = null;
    console.log("Starting agent initialization...");
    status.value = "loading";
            
    await acpService.initialize();
    const enableLoadSession = acpService.hasCapability("loadSession");

    if (enableLoadSession && agentChat && agentChat.sessionId) {
      await acpService.sessionLoad(agentChat.sessionId);
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
      content: '',
      parts: [
        part,
      ],
    });

    if (!agentChat || !agentChat.sessionId) {
      const ret = await acpService.sessionNew();
      agentChat = {
        id: props.chatId,
        topic: "New Session",
        createdAt: new Date(),
        updatedAt: new Date(),
        agentId: props.agent.id,
        sessionId: ret.sessionId,
      };
      await writeChat(agentChat);
    }
    
    (async () => {
      const ret = await acpService.sessionPrompt(part)
      console.log('sessionPrompt result', ret);
    })();
    
    input.value = "";
    status.value = "submitted";
  } catch (err) {
    console.error("Failed to send message:", err);
    error.value = `Failed to send message: ${JSON.stringify(err, null, 2)}`;
    status.value = "error";
  }
};

onMounted(() => {
  start();
});

onUnmounted(() => {
  stop();
});

const sidebarStore = useSidebarStore();
const tabsStore = useTabsStore();

// Watch for name and icon changes and update agent
watch([name, icon], async ([newName, newIcon]) => {
  if (newName !== props.agent.name || newIcon !== props.agent.icon) {
    try {
      await updateAgent(props.agent.id, {
        name: newName,
        icon: newIcon
      });
      sidebarStore.loadAgents();
      tabsStore.setTitle(`/agent/${props.agent.id}`, newName);
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  }
});
</script>

<template>
  <div class="size-full p-6 flex flex-col gap-2 justify-between">
    <hgroup class="flex flex-row gap-2 items-center">
      <IconEdit v-model:icon="icon" />
      <NameEdit v-model:name="name" />
    </hgroup>
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
      @stop="stop"
    />
  </div>
</template>
