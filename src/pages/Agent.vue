<script setup lang="ts">
import { ref, useTemplateRef, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { writeAgent, getAgent, Agent } from "@/db";
import { useTabsStore } from "@/stores/tabs";
import { useSidebarStore } from "@/stores/sidebar";
import { throttle } from "lodash-es";

const route = useRoute();
const agentId = route.params.id as string;
const initialData = await getAgent(agentId);

const agent = ref<{
  name: string;
  icon: string;
  instructions: string;
}>({
  name: initialData?.name ?? "New Agent",
  icon: initialData?.icon ?? "i-lucide-brain",
  instructions: initialData?.instructions ?? "",
});

const { setTitle } = useTabsStore();
const sidebarStore = useSidebarStore();
const toast = useToast();
const editingName = ref(false);
const agentName = ref("");
const input = useTemplateRef("input");

function startEdit() {
  editingName.value = true;
  agentName.value = agent.value.name;
  nextTick(() => {
    const el = input.value?.inputRef;
    el?.focus();
    el?.select();
  });
}

function saveEdit() {
  agent.value.name = agentName.value;
  editingName.value = false;
  setTitle(route.path, agent.value.name);
}

function cancelEdit() {
  editingName.value = false;
}

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
  sidebarStore.load();
});

watch(agent, throttledWatcher, {
  deep: true,
});
</script>

<template>
  <div class="size-full p-6 space-y-4">
    <hgroup class="flex flex-row gap-2 items-center">
      <UButton :icon="agent.icon" variant="outline" />
      <h1 v-if="!editingName" class="flex-1 text-lg" @click="startEdit">
        {{ agent.name }}
      </h1>
      <template v-else>
        <UInput
          ref="input"
          v-model="agentName"
          class="flex-1"
          @keydown.enter="saveEdit"
        />
        <UButton
          icon="i-lucide-check"
          variant="outline"
          :disabled="!agent.name"
          @click="saveEdit"
        />
        <UButton icon="i-lucide-x" variant="outline" @click="cancelEdit" />
      </template>
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
