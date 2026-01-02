<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { modelRepo } from "@/llm/models";

const tabItems = [
  {
    label: "Models",
    icon: "i-mdi-form-select",
    slot: "models" as const,
  },
  {
    label: "MCP",
    icon: "i-mdi-server",
    description: '',
    slot: "mcp" as const,
  },
] satisfies TabsItem[];

const providerItems = [
  {
    label: "Deepseek",
    value: "deepseek",
  },
  {
    label: 'Minimax',
    value: 'minimax'
  },
  {
    label: 'Z.AI',
    value: 'zai'
  },
  {
    label: "OpenRouter",
    value: "openrouter",
  },
  {
    label: "Silliconflow",
    value: "silliconflow",
  },
] satisfies TabsItem[];

const defaultProvider = "deepseek";

const { modelSettings } = storeToRefs(useSettingsStore());

const toggleModel = (provider: string, modelValue: string) => {
  if (!modelSettings.value[provider]?.models) {
    return;
  }
  const models = modelSettings.value[provider].models;
  const index = models.indexOf(modelValue);
  if (index > -1) {
    models.splice(index, 1);
  } else {
    models.push(modelValue);
  }
};
</script>

<template>
  <UTabs :items="tabItems" class="gap-4 w-full">
    <template #models>
      <div class="mx-4 mb-4 flex flex-col gap-2">
        <UTabs
          orientation="vertical"
          variant="link"
          class="w-full"
          :default-value="defaultProvider"
          :items="providerItems"
        >
          <template #content="{ item }">
            <UForm :state="modelSettings" class="flex flex-col relative">
              <p class="text-center">{{ item.label }}</p>
              <UFormField label="Api Key" name="apiKey">
                <UInput
                  v-model.trim="modelSettings[item.value].apiKey"
                  class="w-full"
                />
              </UFormField>

              <!-- Selected Models -->
              <div class="mt-4">
                <h3 class="text-sm font-semibold mb-2">Selected Models</h3>
                <div v-if="modelSettings[item.value]?.models?.length > 0" class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="modelValue in modelSettings[item.value].models"
                    :key="modelValue"
                    :label="modelRepo[item.value as keyof typeof modelRepo]?.find((m: any) => m.value === modelValue)?.label || modelValue"
                    color="primary"
                    variant="subtle"
                  />
                </div>
                <p v-else class="text-sm text-gray-500">No models selected</p>
              </div>

              <!-- Builtin Models -->
              <div class="mt-4">
                <h3 class="text-sm font-semibold mb-2">Available Models</h3>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="model in modelRepo[item.value as keyof typeof modelRepo]"
                    :key="model.value"
                    :label="model.label"
                    size="sm"
                    :variant="modelSettings[item.value]?.models?.includes(model.value) ? 'solid' : 'outline'"
                    @click="toggleModel(item.value, model.value)"
                  />
                </div>
              </div>
            </UForm>
          </template>
        </UTabs>
      </div>
    </template>
    <template #mcp>
      <div class="mx-4 mb-4 flex flex-col gap-2">
        <p class="text-muted">
          Configure MCP servers
        </p>
      </div>
    </template>
  </UTabs>
</template>

<style lang="scss" scoped></style>
