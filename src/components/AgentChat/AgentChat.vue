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
import { invoke } from "@tauri-apps/api/core";
import Mention from "@tiptap/extension-mention";
import MentionMenu from "./MentionMenu.vue";
import MentionItem from "./MentionItem.vue";
import { type Editor } from "@tiptap/core";

const toast = useToast();

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
    await acpService.sessionSetMode(modeId);
  } catch (err) {
    console.error('Failed to set mode:', err);
    error.value = `Failed to set mode: ${JSON.stringify(err, null, 2)}`;
  }
}

function handleCommandSelect(command: AvailableCommand) {
  const commandText = `/${command.name}`;
  chatBoxRef.value?.insertText(commandText);
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
    } else {
      const ret = await acpService.sessionNew();
      sessionId.value = ret.sessionId;
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

interface MentionItem {
  id: string;
  label: string;
  path: string;
  is_dir: boolean;
}

let editorInstance: Editor | null = null;
function selectMention(index: number) {
  const item = mentionItems.value[index];
  if (item && mentionRange.value && editorInstance) {
    editorInstance.chain()
      .focus()
      .insertContentAt(mentionRange.value, [{
        type: 'mention',
        attrs: { id: item.id, label: item.path }
      }])
      .run();
    mentionMenuOpen.value = false;
  }
}

interface FileSuggestion {
  name: string;
  path: string;
  is_dir: boolean;
}

async function globFiles(directory: string, pattern?: string): Promise<FileSuggestion[]> {
  try {
    return invoke<FileSuggestion[]>('glob_files', {
      directory,
      pattern,
    });
  } catch (error) {
    toast.add({
      title: 'Failed to glob files',
      description: error instanceof Error ? error.message : String(error),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    });
    return [];
  }
}

const mentionMenuOpen = ref(false);
const mentionItems = ref<MentionItem[]>([]);
const mentionQuery = ref("");
const selectedIndex = ref(0);
const mentionRange = ref<{ from: number; to: number } | null>(null);
const mentionPosition = ref({ x: 0, y: 0 });
const MENU_HEIGHT = 200; // Estimated max height of the menu
const MENU_OFFSET = 10; // Offset from cursor

function calculateMenuPosition(cursorCoords: { top: number; bottom: number; left: number }) {
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - cursorCoords.bottom;
  const spaceAbove = cursorCoords.top;

  // If there's not enough space below, show menu above the cursor
  if (spaceBelow < MENU_HEIGHT && spaceAbove > MENU_HEIGHT) {
    return {
      x: cursorCoords.left,
      y: cursorCoords.top - MENU_HEIGHT - MENU_OFFSET
    };
  }

  // Default: show below cursor
  return {
    x: cursorCoords.left,
    y: cursorCoords.bottom + MENU_OFFSET
  };
}

const mentionExtension = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    items: async ({ query }) => {
      mentionQuery.value = query;
      const files = await globFiles(props.agent.directory!, `*${query}*`);
      mentionItems.value = files.map((file): MentionItem => ({
        id: file.path,
        label: file.name,
        path: file.path,
        is_dir: file.is_dir,
      }));
      selectedIndex.value = 0;
      return mentionItems.value;
    },
    render: () => {
      return {
        onStart: (props: any) => {
          if (!props.clientRect) {
            return
          }
          mentionRange.value = { from: props.range.from, to: props.range.to };
          const { from } = props.range;
          const { view } = props.editor;
          const start = view.coordsAtPos(from);
          // Calculate position with viewport awareness
          mentionPosition.value = calculateMenuPosition(start);
          mentionMenuOpen.value = true;
          editorInstance = props.editor;
        },

        onUpdate(props: any) {
          mentionRange.value = { from: props.range.from, to: props.range.to };
          const { from } = props.range;
          const { view } = props.editor;
          const start = view.coordsAtPos(from);

          mentionPosition.value = calculateMenuPosition(start);
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            mentionMenuOpen.value = false;
            return true;
          }

          if (props.event.key === 'ArrowUp') {
            selectedIndex.value = (selectedIndex.value - 1 + mentionItems.value.length) % mentionItems.value.length;
            return true;
          }

          if (props.event.key === 'ArrowDown') {
            selectedIndex.value = (selectedIndex.value + 1) % mentionItems.value.length;
            return true;
          }

          if (props.event.key === 'ArrowLeft' || props.event.key === 'ArrowRight') {
            // Allow arrow keys to pass through to the editor for navigation
            return false;
          }

          if (props.event.key === 'Enter') {
            const item = mentionItems.value[selectedIndex.value];
            if (item) {
              selectMention(selectedIndex.value);
            }
            return true;
          }

          return false;
        },

        onExit() {
          mentionMenuOpen.value = false;
          mentionItems.value = [];
          mentionRange.value = null;
        },
      };
    },
  },
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
        class="chat-box"
        :style="{ width: '100%' }"
        v-model="input"
        :status="status"
        :messages="messages"
        @submit="handleSubmit"
        @stop="cancel"
        :extensions="[
          mentionExtension,
        ]"
      >
        <template #left-addons>
          <UButton
            icon="i-lucide-at-sign"
            color="primary"
            variant="soft"
            size="sm"
            @click="chatBoxRef?.insertText('@')"
          />
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
          <MentionMenu
            v-if="mentionMenuOpen"
            :mention-items="mentionItems"
            :selected-index="selectedIndex"
            :position="mentionPosition"
            @select="selectMention($event)"
          />
        </template>
      </ChatBox>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.chat-box {
  :deep(.mention) {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-radius: 0.25rem;
    padding: 0 0.25rem;
    font-weight: 500;
  }
}
</style>