<script setup lang="ts">
import { useRoute } from "vue-router";
import { getChat, getAgent } from "@/db";
import ChatView from "@/components/Chat.vue";
import AgentChat from "@/components/AgentChat/AgentChat.vue";

const route = useRoute();
const chatId = route.params.id as string;
const chat = await getChat(chatId);

const agentId = chat?.agentId ?? sessionStorage.getItem('chat-agent::' + chatId);
let agent;
if (agentId) {
  agent = await getAgent(agentId);
  if (!agent) {
    throw new Error("Agent not found");
  }
}

</script>

<template>
  <AgentChat v-if="agent" :agent="agent" :chat="chat" :chat-id="chatId" />
  <ChatView v-else :chat="chat" :chat-id="chatId" />
</template>

<style lang="scss" scoped></style>
