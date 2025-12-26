<script setup lang="ts">
import { ref, onUnmounted, onMounted } from "vue";
import type { Agent } from "@/db";
import { 
  initialize,
  startListening, 
  sendMessage, 
  stopListening,
  type Message 
} from "@/services/acp";
import ChatBox from "@/components/ChatBox.vue";

const props = defineProps<{ agent: Agent }>();
const program = props.agent.program;
const isInitialized = ref(false);
const isListening = ref(false);
const input = ref("");
const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>("ready");
const error = ref<string | null>(null);
const debug = ref('');
const messages = ref<Message[]>([]);

let unlistenAgentMessage: (() => void) | null = null;

const start = async () => {
  try {
    error.value = null;
    debug.value = "Starting agent initialization...";
    status.value = "streaming";
    
    if (!program) {
      throw new Error("Agent program is not defined");
    }
    
    // Initialize the agent process
    const result = await initialize(program);
    debug.value = `Agent initialized: ${JSON.stringify(result, null, 2)}`;
    
    isInitialized.value = true;
    status.value = "ready";
    
    // Start listening for messages
    try {
      if (!program) {
        throw new Error("Agent program is not defined");
      }
      
      unlistenAgentMessage = await startListening(program, messages.value, debug);
      isListening.value = true;
      status.value = "ready";
    } catch (err) {
      console.error("Failed to start listening:", err);
      error.value = `Failed to start listening: ${err}`;
      debug.value += `\nError starting listener: ${JSON.stringify(err, null, 2)}`;
      status.value = "error";
    }
  } catch (err) {
    console.error("Failed to launch agent:", err);
    error.value = `Failed to launch agent: ${err}`;
    debug.value = `Error: ${JSON.stringify(err, null, 2)}`;
    status.value = "error";
  }
};

const stop = async () => {
  try {
    error.value = null;
    debug.value += "\nStopping agent...";
    
    if (isListening.value && program) {
      await stopListening(program);
      isListening.value = false;
    }
    
    // Clean up event listeners
    if (unlistenAgentMessage) {
      unlistenAgentMessage();
      unlistenAgentMessage = null;
    }
    
    status.value = "ready";
    isInitialized.value = false;
    debug.value += "\nAgent stopped successfully";
  } catch (err) {
    console.error("Failed to stop agent:", err);
    error.value = `Failed to stop agent: ${err}`;
    debug.value += `\nError stopping agent: ${JSON.stringify(err, null, 2)}`;
    status.value = "error";
  }
};

const handleSubmit = async () => {
  if (!input.value.trim() || !isInitialized.value || !program) return;
  
  try {
    error.value = null;
    status.value = "streaming";
    
    const userMessage = input.value.trim();
    messages.value.push({
      role: "user",
      content: userMessage
    });
    
    await sendMessage(program, userMessage, debug);
    
    input.value = "";
    status.value = "ready";
  } catch (err) {
    console.error("Failed to send message:", err);
    error.value = `Failed to send message: ${err}`;
    debug.value += `\nError sending message: ${JSON.stringify(err, null, 2)}`;
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
  <div class="size-full p-6">
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
    <pre>
      {{ debug }}
    </pre>
    <ChatBox
      v-model="input"
      :status="status"
      :messages="messages"
      @submit="handleSubmit"
      @stop="stop"
    />
  </div>
</template>
