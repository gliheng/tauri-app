import { ref } from "vue";
import { defineStore } from "pinia";
import { Chat, getAllChats, deleteChat } from "@/db";
import { eventBus } from "@/utils/eventBus";

export const useChatsStore = defineStore("chats", () => {
  const chats = ref<Chat[]>([]);
  const initialized = ref(false);

  async function loadChats() {
    chats.value = await getAllChats();
    initialized.value = true;
  }

  async function refreshChats() {
    chats.value = await getAllChats();
  }

  async function removeChat(chatId: string) {
    await deleteChat(chatId);
    chats.value = chats.value.filter((e) => e.id !== chatId);
  }

  // Listen for chat events to auto-refresh
  eventBus.on("chat_created", () => {
    refreshChats();
  });

  eventBus.on("chat_updated", () => {
    refreshChats();
  });

  return {
    chats,
    initialized,
    loadChats,
    refreshChats,
    removeChat,
  };
});
