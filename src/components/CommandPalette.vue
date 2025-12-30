<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import { getAllChats, deleteChat, Chat } from "@/db";
import { useTabsStore } from "@/stores/tabs";
import { confirm } from "@tauri-apps/plugin-dialog";

const toast = useToast();
const list = await getAllChats();
const chatList = ref<Chat[]>(list);
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
  const historyItems: ChatHistoryItem[] = chatList.value.map((e) => ({
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
          kbds: ["meta", "N"],
          onSelect() {
            toast.add({ title: "Add new file" });
          },
        },
      ],
    },
  ];
});

function onSelect(item: any) {
  const { chatId } = item as ChatHistoryItem;
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
    await deleteChat(chatId);
    // Remove from chatList
    chatList.value = chatList.value.filter((e) => e.id !== chatId);
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
