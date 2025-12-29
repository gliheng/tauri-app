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

const groups = computed(() => [
  {
    id: "chat-sessions",
    label: "Chat Sessions",
    items: chatList.value.map((e) => ({
      chatId: e.id,
      agentId: e.agentId,
      label: e.topic,
      icon: "i-lucide-message-circle",
      suffix: moment(e.updatedAt).fromNow(),
      slot: "remove",
    })),
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
]);

function onSelect(item: any) {
  const { chatId, agentId } = item;
  if (agentId) {
    openTab(`/agent/${chatId}`, item.label);
    router.push({ name: "agent", params: { id: chatId } });
  } else if (chatId) {
    openTab(`/chat/${chatId}`, item.label);
    router.push({ name: "chat", params: { id: chatId } });
}
  emit("close");
}

async function removeChat(item: any) {
  const ok = await confirm("This action cannot be reverted. Are you sure?", {
    title: "Delete chat",
    kind: "warning",
  });

  if (ok) {
    closeTab(item.id);
    deleteChat(item.id);
  }
}
</script>

<template>
  <UCommandPalette
    class="flex-1 h-80"
    :groups="groups"
    @update:model-value="onSelect"
  >
    <template #remove-trailing="{ item }">
      <UButton
        color="error"
        size="sm"
        icon="i-lucide-trash"
        @click.stop="removeChat(item)"
      />
    </template>
  </UCommandPalette>
</template>
