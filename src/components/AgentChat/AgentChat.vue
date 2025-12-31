<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType } from "vue";
import { Chat, updateChat, writeChat, type Agent } from "@/db";
import ChatBox from "@/components/ChatBox.vue";
import Spinner from "@/components/Spinner.vue";
import MessageList from "./MessageList.vue";
import { generateTopic } from "@/llm/prompt";
import { useTabsStore } from "@/stores/tabs";
import { useAcp } from "@/hooks/useAcp";

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

const isInitialized = ref(false);
const input = ref("");
const error = ref<string | null>(null);

const { acpService, messages, status } = useAcp(props.chatId, props.agent);

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
          icon: 'size-10'
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
