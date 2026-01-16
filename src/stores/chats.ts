import { ref } from "vue";
import { defineStore } from "pinia";
import { Chat, getAllChats, deleteChat } from "@/db-sqlite";

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

  return {
    chats,
    initialized,
    loadChats,
    refreshChats,
    removeChat,
  };
});
