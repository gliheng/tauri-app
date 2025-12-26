<script setup lang="ts">
import { ref, watch } from "vue";
import { throttle } from "lodash-es";
import { writeAgent, getAgent, Agent } from "@/db";
import { useSidebarStore } from "@/stores/sidebar";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";
import ToggleButtonGroup from "@/components/ToggleButtonGroup.vue";

const props = defineProps<{
  create: boolean;
  agent: {
    id: string;
    name: string;
    icon: string;
    type: "chat" | "code";
    instructions?: string;
    directory?: string;
    program?: "codex" | "gemini-cli" | "qwen-code";
  };
}>();

const emit = defineEmits<{
  'update:agent': [value: any];
  'launch': [];
}>();

const sidebarStore = useSidebarStore();

// Create local reactive copies for v-model bindings
const localAgent = ref({ ...props.agent });

// Directory selection
const selectDirectory = async () => {
  try {
    // Use Tauri's dialog API to select directory
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select working directory'
    });
    
    if (selected) {
      localAgent.value.directory = selected as string;
      emit('update:agent', localAgent.value);
    }
  } catch (error) {
    console.error('Failed to select directory:', error);
  }
};

const throttledWatcher = throttle(async (newValue) => {
  const initialData = await getAgent(props.agent.id);
  const data: Agent = {
    ...initialData,
    ...newValue,
    updatedAt: new Date(),
  };
  if (!initialData) {
    data.createdAt = new Date();
  }
  await writeAgent(data);
  sidebarStore.loadAgents();
}, 1000);

watch(localAgent, (newValue) => {
  emit('update:agent', newValue);
  throttledWatcher(newValue);
}, {
  deep: true,
});

const launchAgent = () => {
  emit('launch');
};
</script>

<template>
  <div class="size-full p-6 space-y-4">
    <hgroup class="flex flex-row gap-2 items-center">
      <IconEdit v-model:icon="localAgent.icon" />
      <NameEdit v-model:name="localAgent.name" />
    </hgroup>
    <div class="flex flex-row gap-2 items-center">
      <h2 class="text-lg">Type</h2>
      <ToggleButtonGroup
        v-model="localAgent.type"
        :options="[
          { value: 'chat', label: 'Chat' },
          { value: 'code', label: 'Code' }
        ]"
      />
    </div>
    <section v-if="localAgent.type === 'chat'">
      <h2 class="text-lg mb-2">Instructions</h2>
      <UTextarea
        v-model="localAgent.instructions"
        class="w-full"
        :rows="15"
        :maxrows="30"
        placeholder="Agent instructions"
      />
    </section>
    <section v-else-if="localAgent.type === 'code'">
      <div class="space-y-4">
        <div>
          <h2 class="text-lg mb-2">Working Directory</h2>
          <div class="flex gap-2">
            <UInput
              :model-value="localAgent.directory"
              placeholder="Select a directory..."
              class="flex-1"
              readonly
            />
            <UButton
              icon="i-lucide-folder"
              label="Browse"
              @click="selectDirectory"
            />
          </div>
        </div>
        <div>
          <h2 class="text-lg mb-2">Code Program</h2>
          <ToggleButtonGroup
            v-model="localAgent.program"
            :options="[
              { value: 'codex', label: 'Codex' },
              { value: 'gemini-cli', label: 'Gemini CLI' },
              { value: 'qwen-code', label: 'Qwen Code' }
            ]"
          />
        </div>
      </div>
    </section>
    <section class="flex justify-center mt-10">
      <UButton
        class="text-xl px-8 py-4"
        color="primary"
        size="xl"
        icon="i-lucide-rocket"
        @click="launchAgent"
      >{{ create ? 'Launch' : 'Save' }}</UButton>
    </section>
  </div>
</template>
