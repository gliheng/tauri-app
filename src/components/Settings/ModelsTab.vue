<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { MODELS_BY_PROVIDER } from "@/constants";

const providerItems = [
  {
    label: "Deepseek",
    value: "deepseek",
  },
  {
    label: "Minimax",
    value: "minimax",
  },
  {
    label: "Z.AI",
    value: "zai",
  },
  {
    label: "OpenRouter",
    value: "openrouter",
  },
  {
    label: "Siliconflow",
    value: "siliconflow",
  },
] satisfies TabsItem[];

const agentItems = [
  {
    label: "Codex",
    value: "codex",
  },
  {
    label: "Gemini",
    value: "gemini",
  },
  {
    label: "Claude",
    value: "claude",
  },
  {
    label: "Qwen",
    value: "qwen",
  },
  {
    label: "OpenCode",
    value: "opencode",
  },
] satisfies TabsItem[];

const imageProviderItems = [
  {
    label: "OpenAI",
    value: "openai",
  },
  {
    label: "Stability AI",
    value: "stability",
  },
  {
    label: "SiliconFlow",
    value: "siliconflow",
  },
] satisfies TabsItem[];

const defaultProvider = "deepseek";
const defaultAgent = "codex";
const defaultImageProvider = "openai";

const { modelSettings, agentSettings, chatSettings, imageSettings } = storeToRefs(useSettingsStore());

const modelList = computed(() => {
  const models: Array<{ label: string; value: string; provider: string }> = [];
  
  for (const [provider, config] of Object.entries(modelSettings.value)) {
    const providerConfig = config as { apiKey: string; models: Array<string> };
    const providerModels = MODELS_BY_PROVIDER[provider as keyof typeof MODELS_BY_PROVIDER] || [];
    
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
    const chatModel = chatSettings.value.chatModel;
    return modelList.value.find(m => m.value === chatModel) || modelList.value[0];
  },
  set: (value) => {
    if (value) {
      chatSettings.value.chatModel = value.value;
    }
  }
});

const getAvailableModels = (provider: string) => {
  const providerConfig = MODELS_BY_PROVIDER[provider as keyof typeof MODELS_BY_PROVIDER];
  if (!providerConfig) return [];
  
  return providerConfig.filter((m: any) => {
    const models = (modelSettings.value as any)[provider]?.models;
    return !models?.includes(m.value);
  });
};

const toggleModel = (provider: string, modelValue: string) => {
  const providerConfig = (modelSettings.value as any)[provider];
  if (!providerConfig?.models) {
    return;
  }
  const models = providerConfig.models;
  const index = models.indexOf(modelValue);
  if (index > -1) {
    models.splice(index, 1);
  } else {
    models.push(modelValue);
  }
};



</script>

<template>
  <div>
    <h2 class="text-lg font-semibold">Default Model</h2>
    <UFormField label="Select default chat model">
      <USelectMenu
        v-model="selectedModel"
        color="neutral"
        variant="soft"
        trailing-icon="i-lucide-chevrons-up-down"
        :items="modelList"
        placeholder="Select a model"
        class="w-full"
      >
        <template #item-leading="{ item }">
          <UBadge size="xs" :label="item.provider" />
        </template>
      </USelectMenu>
    </UFormField>
    <h2 class="text-lg font-semibold mt-4">Chat Models</h2>
    <div class="flex-1 min-h-0">
      <UTabs
        orientation="vertical"
        variant="link"
        class="w-full items-start"
        :default-value="defaultProvider"
        :items="providerItems"
      >
        <template #content="{ item }">
          <UForm :state="modelSettings" class="flex flex-col relative">
            <p class="text-center">{{ item.label }}</p>
            <UFormField label="Api Key" name="apiKey">
              <UInput
                v-model.trim="
                  modelSettings[item.value as keyof typeof modelSettings]
                    .apiKey
                "
                class="w-full"
              />
            </UFormField>

            <div class="mt-4">
              <h3 class="text-sm font-semibold mb-2">Selected Models</h3>
              <div
                v-if="
                  modelSettings[item.value as keyof typeof modelSettings]
                    ?.models?.length > 0
                "
                class="flex flex-wrap gap-2"
              >
                <UButton
                  v-for="modelValue in modelSettings[
                    item.value as keyof typeof modelSettings
                  ].models"
                  :key="modelValue"
                  :label="
                    MODELS_BY_PROVIDER[item.value as keyof typeof MODELS_BY_PROVIDER]?.find(
                      (m: any) => m.value === modelValue,
                    )?.label || modelValue
                  "
                  color="primary"
                  variant="subtle"
                  @click="toggleModel(item.value, modelValue)"
                />
              </div>
              <p v-else class="text-sm text-gray-500">No models selected</p>
            </div>

            <div class="mt-4">
              <h3 class="text-sm font-semibold mb-2">Available Models</h3>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="model in getAvailableModels(item.value)"
                  :key="model.value"
                  :label="model.label"
                  variant="outline"
                  @click="toggleModel(item.value as string, model.value)"
                />
              </div>
              <p
                v-if="
                  MODELS_BY_PROVIDER[
                    item.value as keyof typeof MODELS_BY_PROVIDER
                  ].filter(
                    (m: any) =>
                      !modelSettings[
                        item.value as keyof typeof modelSettings
                      ]?.models?.includes(m.value),
                  ).length === 0
                "
                class="text-sm text-gray-500 mt-2"
              >
                All models selected
              </p>
            </div>
          </UForm>
        </template>
      </UTabs>
    </div>
    <h2 class="text-lg font-semibold mt-4">Agent Models</h2>
    <div class="flex-1 min-h-0">
      <UTabs
        orientation="vertical"
        variant="link"
        class="w-full items-start"
        :default-value="defaultAgent"
        :items="agentItems"
      >
        <template #content="{ item }">
          <UForm
            :state="agentSettings"
            class="flex flex-col relative gap-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-center font-medium">{{ item.label }}</p>
              <USwitch
                v-model="(agentSettings as any)[item.value].useCustomModel"
                label="Use custom model"
              />
            </div>

            <UFormField label="Base URL" name="baseUrl">
              <UInput
                v-model.trim="(agentSettings as any)[item.value].baseUrl"
                placeholder="https://api.example.com"
                class="w-full"
                :disabled="!(agentSettings as any)[item.value].useCustomModel"
              />
            </UFormField>

            <UFormField label="Model" name="model">
              <UInput
                v-model.trim="(agentSettings as any)[item.value].model"
                placeholder="gpt-4, claude-3, etc."
                class="w-full"
                :disabled="!(agentSettings as any)[item.value].useCustomModel"
              />
            </UFormField>

            <UFormField label="API Key" name="apiKey">
              <UInput
                v-model.trim="(agentSettings as any)[item.value].apiKey"
                placeholder="Your API key"
                class="w-full"
                :disabled="!(agentSettings as any)[item.value].useCustomModel"
              />
            </UFormField>
          </UForm>
        </template>
      </UTabs>
    </div>
    <h2 class="text-lg font-semibold mt-4">Image Models</h2>
    <div class="flex-1 min-h-0">
      <UTabs
        orientation="vertical"
        variant="link"
        class="w-full items-start"
        :default-value="defaultImageProvider"
        :items="imageProviderItems"
      >
        <template #content="{ item }">
          <div class="flex flex-col relative">
            <p class="text-center">{{ item.label }}</p>
            <UFormField label="Api Key" name="apiKey">
              <UInput
                v-model.trim="(imageSettings as any)[item.value].apiKey"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
