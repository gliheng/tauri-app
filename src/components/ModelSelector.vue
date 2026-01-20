<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "../stores/settings";
import { modelRepo } from "../llm/models";
import ICustomAnthropic from '~icons/custom/anthropic';
import ICustomOpenai from '~icons/custom/openai';
import ICustomGemini from '~icons/custom/gemini';
import ICustomSiliconflow from '~icons/custom/siliconflow';
import ICustomOpenrouter from '~icons/custom/openrouter';
import ICustomMinimax from '~icons/custom/minimax';
import ICustomZai from '~icons/custom/zai';
import ICustomDeepseek from '~icons/custom/deepseek';
import ICustomOllama from '~icons/custom/ollama';
import CircleQuestionMark from '~icons/lucide/circle-question-mark';

const iconMap = {
  anthropic: ICustomAnthropic,
  openai: ICustomOpenai,
  gemini: ICustomGemini,
  siliconflow: ICustomSiliconflow,
  openrouter: ICustomOpenrouter,
  minimax: ICustomMinimax,
  zai: ICustomZai,
  deepseek: ICustomDeepseek,
  ollama: ICustomOllama,
}

function getIcon(provider: string) {
  return iconMap[provider as keyof typeof iconMap] ?? CircleQuestionMark;
}

const settingsStore = useSettingsStore();

const modelList = computed(() => {
  const models: Array<{ label: string; value: string; provider: string }> = [];
  
  for (const [provider, config] of Object.entries(settingsStore.modelSettings)) {
    const providerConfig = config as { apiKey: string; models: Array<string> };
    const providerModels = modelRepo[provider as keyof typeof modelRepo] || [];
    
    for (const modelValue of providerConfig.models) {
      const modelInfo = providerModels.find(m => m.value === modelValue);
      if (modelInfo) {
        models.push({
          label: modelInfo.label,
          provider,
          value: `${provider}::${modelValue}`,
        });
      }
    }
  }
  
  return models;
});

const selectedModel = computed({
  get: () => {
    const chatModel = settingsStore.chatSettings.chatModel;
    return modelList.value.find(m => m.value === chatModel) || modelList.value[0];
  },
  set: (value) => {
    if (value) {
      settingsStore.chatSettings.chatModel = value.value;
    }
  }
});
</script>

<template>
  <UTooltip text="Select Model for this conversation">
    <USelectMenu
      class="w-40"
      v-model="selectedModel"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevrons-up-down"
      :items="modelList"
      :ui="{
        base: 'bg-primary/10 hover:bg-primary/15 text-primary-500 focus-visible:bg-primary/15',
        trailingIcon: 'text-primary-500',
      }"
    >
      <template #item-leading="{ item }">
        <UBadge
          size="xs"
          color="neutral"
          variant="outline"
          :icon="getIcon(item.provider as keyof typeof iconMap)"
        />
      </template>
    </USelectMenu>
  </UTooltip>
</template>

<style lang="scss" scoped></style>
