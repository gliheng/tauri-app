<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { throttle } from "lodash-es";
import { writeAgent, getAgent, Agent } from "@/db";
import { useSidebarStore } from "@/stores/sidebar";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";

const route = useRoute();
const agentId = route.params.id as string;
const initialData = await getAgent(agentId);

const agent = ref<{
  name: string;
  icon: string;
  instructions: string;
}>({
  name: initialData?.name ?? "New Agent",
  icon: initialData?.icon ?? "i-lucide-sticky-note",
  instructions: initialData?.instructions ?? "",
});

const sidebarStore = useSidebarStore();

const throttledWatcher = throttle(async (newValue) => {
  const data: Agent = {
    ...initialData,
    ...newValue,
    id: agentId,
    updatedAt: new Date(),
  };
  if (!initialData) {
    data.createdAt = new Date();
  }
  await writeAgent(data);
  sidebarStore.loadAgents();
}, 1000);

watch(agent, throttledWatcher, {
  deep: true,
});
</script>

<template>
  <div class="size-full p-6 space-y-4">
    <hgroup class="flex flex-row gap-2 items-center">
      <IconEdit v-model:icon="agent.icon" />
      <NameEdit v-model:name="agent.name" />
    </hgroup>
    <section>
      <h2 class="text-lg mb-2">Instructions</h2>
      <UTextarea
        v-model="agent.instructions"
        class="w-full"
        :rows="15"
        :maxrows="30"
        placeholder="Agent instructions"
      />
    </section>
  </div>
</template>
