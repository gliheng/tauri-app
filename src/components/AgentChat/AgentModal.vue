<script setup lang="ts">
import { ref, toRaw } from "vue";
import IconEdit from "@/components/IconEdit.vue";
import ToggleButtonGroup from "@/components/ToggleButtonGroup.vue";
import { AgentProgram } from "@/db";
import ICustomOpencode from '~icons/custom/opencode';
import ICustomQwen from '~icons/custom/qwen';
import ICustomCodex from '~icons/custom/codex';
import ICustomClaude from '~icons/custom/claude';
import ICustomGemini from '~icons/custom/gemini';

export interface AgentFormData {
  name: string;
  icon: string;
  program: AgentProgram;
  directory: string;
}

const emit = defineEmits<{
  close: [agent: AgentFormData];
}>();

const agent = ref<AgentFormData>({
  name: 'New Agent',
  icon: 'i-lucide-brain',
  program: 'codex' as const,
  directory: '',
});

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
      agent.value.directory = selected as string;
    }
  } catch (error) {
    console.error('Failed to select directory:', error);
  }
};

const createAgent = () => {
  emit('close', toRaw(agent.value) as AgentFormData);
};
</script>

<template>
  <UModal>
    <template #content>
      <div class="size-full p-6 space-y-4">
        <hgroup class="flex flex-row gap-2 items-center">
          <IconEdit v-model:icon="agent.icon" />
          <UInput class="flex-1" v-model="agent.name" />
        </hgroup>
        <section>
          <h2 class="text-lg mb-2">Agent Program</h2>
          <ToggleButtonGroup
            v-model="agent.program"
            :options="[
              { value: 'codex', label: 'Codex', icon: ICustomCodex },
              { value: 'gemini', label: 'Gemini CLI', icon: ICustomGemini },
              { value: 'claude', label: 'Claude Code', icon: ICustomClaude },
              { value: 'qwen', label: 'Qwen Code', icon: ICustomQwen },
              { value: 'opencode', label: 'OpenCode', icon: ICustomOpencode },
            ]"
          />
        </section>
        <section>
          <h2 class="text-lg mb-2">Working Directory</h2>
          <div class="flex gap-2">
            <UInput
              class="flex-1"
              placeholder="Select a directory..."
              :model-value="agent.directory"
              readonly
            />
            <UButton
              icon="i-lucide-folder"
              label="Browse"
              @click="selectDirectory"
            />
          </div>
        </section>
        <section class="flex justify-center mt-10">
          <UButton
            class="text-xl px-8 py-4"
            color="primary"
            size="xl"
            icon="i-lucide-wand-sparkles"
            @click="createAgent"
          >Create</UButton>
        </section>
      </div>
    </template>
  </UModal>
</template>
