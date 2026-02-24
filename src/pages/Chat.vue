<script setup lang="ts">
import { onActivated } from "vue";
import { useRoute } from "vue-router";
import { getChat, getAgent, Agent } from "@/db";
import SimpleChat from "@/components/SimpleChat/SimpleChat.vue";
import AgentChat from "@/components/AgentChat/AgentChat.vue";
import { eventBus } from "@/utils/eventBus";
import { useTabsStore } from "@/stores/tabs";

const route = useRoute();
const chatId = route.params.id as string;
const chat = await getChat(chatId);
const tabsStore = useTabsStore();

const agentId = chat?.agentId ?? sessionStorage.getItem('chat-agent::' + chatId);
let agent: Agent | null;
if (agentId) {
  agent = await getAgent(agentId);
  if (!agent) {
    throw new Error("Agent not found");
  }
}

onActivated(() => {
  tabsStore.openTab(`/chat/${chatId}`, "New chat");
  if (agent) {
    eventBus.emit('artifact', 'workspace::' + agent.directory);
  }
});
</script>

<template>
  <AgentChat v-if="agent" :agent="agent" :chat="chat" :chat-id="chatId" />
  <SimpleChat v-else :chat="chat" :chat-id="chatId" />
</template>

<style lang="scss" scoped></style>
