<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "../stores/settings";
import { modelRepo } from "../llm/models";

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
        <UBadge size="xs" :label="item.provider" />
      </template>
    </USelectMenu>
  </UTooltip>
</template>

<style lang="scss" scoped></style>
