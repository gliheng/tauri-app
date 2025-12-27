<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType } from "vue";
import { getAgentSession, writeAgentSession, type Agent } from "@/db";
import { ACPService } from "@/services/acp";
import ChatBox from "@/components/ChatBox.vue";

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
const isInitialized = ref(false);
const input = ref("");
const messages = ref<any[]>([]);
const status = ref<'loading' | 'submitted' | 'streaming' | 'ready' | 'error'>("ready");
const error = ref<string | null>(null);

const acpService = new ACPService({ 
  program: props.agent.program! + "::" + props.chatId, // Start a new process for each chat
  directory: props.agent.directory!,
  mcpServers: [],
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
      if (update.sessionUpdate == 'agent_message_chunk') {
        messages.value.push({
          role: "assistant",
          content: update.content,
        });
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

    if (agentSession && agentSession.sessionId) {
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
    error.value = `Failed to send message: ${err}`;
    status.value = "error";
  }
};

onMounted(() => {
  start();
});

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div class="size-full p-6 flex flex-col gap-2 justify-between">
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
    <div>
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
