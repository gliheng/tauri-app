<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import { useTabsStore } from "@/stores/tabs";
import { useChatsStore } from "@/stores/chats";
import { confirm } from "@tauri-apps/plugin-dialog";

const tabsStore = useTabsStore();
const chatsStore = useChatsStore();
const { openTab, closeTab } = useTabsStore();
const router = useRouter();

const emit = defineEmits<{
  (e: "close"): void;
}>();

interface ChatHistoryItem {
  chatId: string;
  agentId?: string;
  label: string;
  icon: string;
  suffix: string;
}

const groups = computed(() => {
  const historyItems: ChatHistoryItem[] = chatsStore.chats.map((e) => ({
    chatId: e.id,
    agentId: e.agentId,
    label: e.topic,
    icon: e.agentId ? "i-lucide-brain" : "i-lucide-message-circle",
    suffix: moment(e.updatedAt).fromNow(),
    slot: "chat-item",
  }));

  return [
    {
      id: "chat-sessions",
      label: "Chat Sessions",
      items: historyItems,
    },
    {
      id: "actions",
      items: [
        {
          label: "Add new chat",
          suffix: "Add new chat",
          icon: "i-lucide-file-plus",
          onSelect() {
            tabsStore.createNewChat();
            emit("close");
          },
        },
        {
          label: "Open message list",
          suffix: "Test all messages",
          icon: "i-lucide-list",
          onSelect() {
            router.push({
              name: "msglist",
            });
            emit("close");
          },
        },
        {
          label: "Open editor",
          suffix: "Test code editor",
          icon: "i-lucide-code",
          onSelect() {
            router.push({
              name: "editor",
            });
            emit("close");
          },
        },
        {
          label: "Open ACP debug",
          suffix: "Test ACP",
          icon: "i-lucide-list",
          onSelect() {
            router.push({
              name: "acpdebug",
            });
            emit("close");
          },
        },
      ],
    },
  ];
});

function onSelect(item: any) {
  const { chatId } = item as ChatHistoryItem;
  if (!chatId) return;
  openTab(`/chat/${chatId}`, item.label);
  router.push({ name: "chat", params: { id: chatId } });
  emit("close");
}

async function onRemoveChat(item: any) {
  const ok = await confirm("This action cannot be reverted. Are you sure?", {
    title: "Delete chat",
    kind: "warning",
  });

  if (ok) {
    const { chatId } = item as ChatHistoryItem;
    closeTab(chatId);
    await chatsStore.removeChat(chatId);
  }
}
</script>

<template>
  <UCommandPalette
    class="flex-1 h-80"
    :groups="groups"
    @update:model-value="onSelect"
  >
    <template #chat-item-trailing="{ item }">
      <UButton
        color="error"
        size="sm"
        icon="i-lucide-trash"
        @click.stop="onRemoveChat(item)"
      />
    </template>
  </UCommandPalette>
</template>
