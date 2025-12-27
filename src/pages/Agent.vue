<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { getAgent, type Agent } from "@/db";
import AgentConfig from "@/components/AgentConfig.vue";
import AgentSessionList from "@/components/AgentSessionList.vue";
import { nanoid } from "nanoid";

const route = useRoute();
const agentId = route.params.id as string;
const chatId = ref(nanoid());
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
const showConfig = ref(initialData ? false : true);

const updateAgent = (newAgentData: Partial<Agent>) => {
  agent.value = { ...agent.value, ...newAgentData };
};

const launchAgent = async () => {
  showConfig.value = false;
}

const onNewSession = () => {
  chatId.value = nanoid();
}
</script>

<template>
  <div class="relative size-full">
    <AgentConfig
      v-if="showConfig"
      :agent="agent"
      :create="!initialData"
      @update:agent="updateAgent"
      @launch="launchAgent"
    />
    <div v-else class="h-full">
      <div class="absolute top-2 right-2 flex items-center gap-2">
        <UPopover>
          <UButton
            icon="i-heroicons-queue-list-20-solid"
            color="neutral"
            variant="subtle"
          />
          <template #content>
            <AgentSessionList :agent-id="agentId" v-model:chat-id="chatId" @new-session="onNewSession" />
          </template>
        </UPopover>
        <UButton
          icon="i-heroicons-arrow-up-tray-20-solid"
          color="neutral"
          variant="subtle"
          @click="showConfig = true"
        ></UButton>
      </div>
      <KeepAlive>
        <AgentChat
          :key="chatId"
          :agent="agent"
          :chat-id="chatId"
        />
      </KeepAlive>
    </div>
  </div>
</template>
