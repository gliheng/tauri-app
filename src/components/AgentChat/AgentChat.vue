<script setup lang="ts">
import { ref, onUnmounted, onMounted, PropType, computed } from "vue";
import { Chat, updateChat, writeChat, type Agent } from "@/db-sqlite";
import ChatBox from "@/components/ChatBox.vue";
import Spinner from "@/components/Spinner.vue";
import MessageList from "./MessageList.vue";
import ModeSelector from "./ModeSelector.vue";
import SlashCommandMenu from "./SlashCommandMenu.vue";
import { generateTopic } from "@/llm/prompt";
import { useTabsStore } from "@/stores/tabs";
import { useAcp, type AvailableCommand } from "@/hooks/useAcp";
import { ACPMethod } from "@/services/acp";

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
const sessionId = ref<string | null>(props.chat?.sessionId ?? null);
const chatBoxRef = ref<InstanceType<typeof ChatBox> | null>(null);

const { acpService, messages, status, currentModeId, availableModes, availableCommands } = useAcp({
  chatId: props.chatId,
  agent: props.agent,
  onInvoke(method, params) {
    if (method === ACPMethod.SessionUpdate) {
      if (params.update.sessionUpdate === "agent_message_chunk") {
        status.value = 'streaming';
      }
    }
  },
});

const hasModes = computed(() => availableModes.value.length > 0);
const hasCommands = computed(() => availableCommands.value.length > 0);

async function handleModeChange(modeId: string) {
  if (!acpService) return;
  try {
    currentModeId.value = modeId;
    await ensureSession();
    await acpService.sessionSetMode(modeId);
  } catch (err) {
    console.error('Failed to set mode:', err);
    error.value = `Failed to set mode: ${JSON.stringify(err, null, 2)}`;
  }
}

function handleCommandSelect(command: AvailableCommand) {
  const commandText = `/${command.name}`;
  const cursorPosition = commandText.length;
  setTimeout(() => {
    chatBoxRef.value?.setInputAndFocus(commandText, cursorPosition);
  }, 0);
}

async function ensureSession() {
  if (!sessionId.value) {
    const ret = await acpService.sessionNew();
    sessionId.value = ret.sessionId;
    console.log('Session created:', ret);
  }
}

const start = async () => {
  try {
    error.value = null;
    console.log("Starting agent initialization...");

    await acpService.initialize();

    const enableLoadSession = acpService.hasCapability("loadSession");

    if (enableLoadSession && props.chat && props.chat.sessionId) {
      status.value = 'streaming';
      await acpService.sessionLoad(props.chat.sessionId);
      status.value = 'ready';
    }

    console.log("Agent initialized successfully");
    isInitialized.value = true;
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

    error.value = null;    
    input.value = "";
    status.value = "submitted";

    if (!props.chat && messages.value.length === 1) {
      await ensureSession();
  
      // Async update chat meta data
      (async () => {
        const { text: topic } = await generateTopic(messages.value[0].content);
        const agentChat = {
          id: props.chatId,
          topic: topic,
          createdAt: new Date(),
          updatedAt: new Date(),
          agentId: props.agent.id,
          sessionId: sessionId.value!,
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
        <MessageList :messages="messages" :status="status" />
      </div>
      <ChatBox
        ref="chatBoxRef"
        :style="{ width: '100%' }"
        v-model="input"
        :status="status"
        :messages="messages"
        @submit="handleSubmit"
        @stop="cancel"
      >
        <template #left-addons>
          <SlashCommandMenu
            v-if="hasCommands"
            :available-commands="availableCommands"
            :disabled="status === 'streaming'"
            @select="handleCommandSelect"
          />
          <ModeSelector
            v-if="hasModes"
            v-model="currentModeId"
            :available-modes="availableModes"
            :disabled="status === 'streaming'"
            @update:modelValue="handleModeChange"
          />
        </template>
      </ChatBox>
    </template>
  </div>
</template>
