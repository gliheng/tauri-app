<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType, watch } from "vue";
import { getAgentSession, writeAgentSession, type Agent, updateAgent } from "@/db";
import { ACPService } from "@/services/acp";
import ChatBox from "@/components/ChatBox.vue";
import { getModelConfig } from "@/llm";
import { useSidebarStore } from "@/stores/sidebar";
import { useTabsStore } from "@/stores/tabs";

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
const messages = ref<any[]>([]);
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
  onInvoke(method, params) {
    console.log("Method", method, "invoked with params", params);
    if (method == 'session/update') {
      const { update } = params;
      const lastMessage = messages.value[messages.value.length - 1];
      if (update.sessionUpdate == 'agent_message_chunk') {
        // Add message chunk
        if (lastMessage.role === 'assistant' && lastMessage.content.type == 'text' && update.content.type == 'text') {
          lastMessage.content.text += update.content.text;
        } else {
          messages.value.push({
            role: "assistant",
            content: update.content,
          });
        }
      } else if (update.sessionUpdate == 'user_message_chunk') {
        messages.value.push({
          role: "user",
          content: update.content,
        });
      }
    }
  },
});

let agentSession = await getAgentSession(props.chatId);

const start = async () => {
  try {
    error.value = null;
    console.log("Starting agent initialization...");
    status.value = "loading";
            
    await acpService.initialize();
    const enableLoadSession = acpService.hasCapability("loadSession");

    if (enableLoadSession && agentSession && agentSession.sessionId) {
      await acpService.sessionLoad(agentSession.sessionId);
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
    
    const userMessage = {
      type: 'text' as const,
      text: input.value.trim(),
    };

    messages.value.push({
      role: "user",
      content: userMessage
    });

    if (!agentSession || !agentSession.sessionId) {
      const ret = await acpService.sessionNew();
      agentSession = {
        id: props.chatId,
        agentId: props.agent.id,
        sessionId: ret.sessionId,
        title: "New Session",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await writeAgentSession(agentSession);
    }
    
    await acpService.sessionPrompt(userMessage);
    
    input.value = "";
    status.value = "ready";
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
    <div class="flex-1 overflow-y-auto min-h-0">
      <p v-for="msg of messages" :key="msg.id">{{ msg.content }}</p>
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
