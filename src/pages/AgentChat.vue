<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { getAgent, getChat, type Agent } from "@/db";
import AgentChatView from "@/components/AgentChat/AgentChat.vue";

const route = useRoute();
const chatId = route.params.id as string;
const chatRecord = await getChat(chatId);
const agentId = chatRecord?.chat.agentId ?? sessionStorage.getItem('chat-agent::' + chatId);
const initialData = await getAgent(agentId);

const agent = ref<Agent>({
  id: agentId,
  name: initialData?.name ?? "New Agent",
  icon: initialData?.icon ?? "i-lucide-sticky-note",
  type: initialData?.type ?? "chat",
  instructions: initialData?.instructions,
  directory: initialData?.directory,
  program: initialData?.program ?? "codex",
  createdAt: initialData?.createdAt ?? new Date(),
  updatedAt: initialData?.updatedAt ?? new Date(),
});
</script>

<template>
  <AgentChatView
    :key="chatId"
    :agent="agent"
    :chat-id="chatId"
  />
</template>
