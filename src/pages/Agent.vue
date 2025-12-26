<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { getAgent, type Agent } from "@/db";
import AgentConfig from "@/components/AgentConfig.vue";

const route = useRoute();
const agentId = route.params.id as string;
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
    <div v-else>
      <UButton
        class="absolute top-2 right-2"
        icon="i-heroicons-arrow-up-tray-20-solid"
        @click="showConfig = true"
      ></UButton>
      <AgentChat :agent="agent" />
    </div>
  </div>
</template>
