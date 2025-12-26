<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType } from "vue";
import type { Agent } from "@/db";
import { ACPService } from "@/services/acp";
import ChatBox from "@/components/ChatBox.vue";

const props = defineProps({
  agent: {
    type: Object as PropType<Agent>,
    required: true,
  },
});
const isInitialized = ref(false);
const input = ref("");
const messages = ref<any[]>([]);
const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>("ready");
const error = ref<string | null>(null);
const debug = ref<string[]>([]);

const acpService = new ACPService({ 
  program: props.agent.program!,
  directory: props.agent.directory!,
  mcpServers: [],
  onConnect() {
    console.log('onConnect');
  },
  onDisconnect() {
    console.log('onDisconnect');
  },
  onInvoke(method, params) {
    if (method == 'session/update') {
      const { update } = params;
      if (update.sessionUpdate == 'agent_message_chunk') {
        messages.value.push({
          role: "assistant",
          content: update.content,
        });
      }
    }
    console.log("Method", method, "invoked with params", params);
  },
});

const start = async () => {
  try {
    error.value = null;
    debug.value.push("Starting agent initialization...");
    status.value = "streaming";
            
    await acpService.initialize();
    
    debug.value.push("Agent initialized successfully", JSON.stringify((acpService as any).initializeResponse, null, 2));
    isInitialized.value = true;
    status.value = "ready";
  } catch (err) {
    console.error("Failed to launch agent:", err);
    error.value = `Failed to launch agent: ${err}`;
    debug.value.push(`Error: ${JSON.stringify(err, null, 2)}`);
    status.value = "error";
  }
};

const stop = async () => {
  try {
    error.value = null;
    debug.value.push("Stopping agent...");
    
    if (acpService && isInitialized.value) {
      await acpService.dispose();
    }
    
    status.value = "ready";
    isInitialized.value = false;
    debug.value.push("Agent stopped successfully");
  } catch (err) {
    console.error("Failed to stop agent:", err);
    error.value = `Failed to stop agent: ${err}`;
    debug.value.push(`Error stopping agent: ${JSON.stringify(err, null, 2)}`);
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

    await acpService.sessionNew();
    
    await acpService.sessionPrompt(userMessage);
    
    input.value = "";
    status.value = "ready";
  } catch (err) {
    console.error("Failed to send message:", err);
    error.value = `Failed to send message: ${err}`;
    debug.value.push(`Error sending message: ${JSON.stringify(err, null, 2)}`);
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
