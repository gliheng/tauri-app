<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { modelRepo } from "@/llm/models";
import type { SelectMenuItem } from "@nuxt/ui";
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

const model = defineModel<string>();

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
  const models: SelectMenuItem[] = [];
  
  for (const [provider, config] of Object.entries(settingsStore.modelSettings)) {
    const providerConfig = config as { apiKey: string; models: Array<string> };
    const providerModels = modelRepo[provider as keyof typeof modelRepo] || [];
    
    if (providerConfig.models.length > 0) {
      models.push({
        type: 'label',
        label: provider.charAt(0).toUpperCase() + provider.slice(1),
      });
      
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
  }
  
  return models;
});
</script>

<template>
  <UTooltip text="Select Model for this conversation">
    <USelectMenu
      class="w-40"
      v-model="model"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevrons-up-down"
      value-key="value"
      size="sm"
      :items="modelList"
      placeholder="Model"
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
          :icon="getIcon((item as any).provider)"
        />
      </template>
    </USelectMenu>
  </UTooltip>
</template>

<style lang="scss" scoped></style>
