<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { CodeAgent, useSettingsStore } from "@/stores/settings";
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
    description: "",
    slot: "mcp" as const,
  },
] satisfies TabsItem[];

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
    label: "Silliconflow",
    value: "silliconflow",
  },
] satisfies TabsItem[];

const defaultProvider = "deepseek";

const codeAgentItems = [
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
] satisfies TabsItem[];

const defaultCodeAgent = "codex";

const { modelSettings, codeAgentSettings } = storeToRefs(useSettingsStore());

const getAvailableModels = (provider: string) => {
  return modelRepo[provider as keyof typeof modelRepo].filter(
    (m: any) =>
      !modelSettings.value[provider as keyof typeof modelSettings]?.models?.includes(
        m.value,
      ),
  );
};

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
        <h1 class="text-lg font-semibold">Chat Models</h1>
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

              <!-- Selected Models -->
              <div class="mt-4">
                <h3 class="text-sm font-semibold mb-2">Selected Models</h3>
                <div
                  v-if="
                    modelSettings[item.value as keyof typeof modelSettings]
                      ?.models?.length > 0
                  "
                  class="flex flex-wrap gap-2"
                >
                  <UBadge
                    v-for="modelValue in modelSettings[
                      item.value as keyof typeof modelSettings
                    ].models"
                    :key="modelValue"
                    :label="
                      modelRepo[item.value as keyof typeof modelRepo]?.find(
                        (m: any) => m.value === modelValue,
                      )?.label || modelValue
                    "
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
                    v-for="model in getAvailableModels(item.value)"
                    :key="model.value"
                    :label="model.label"
                    size="sm"
                    variant="outline"
                    @click="toggleModel(item.value as string, model.value)"
                  />
                </div>
                <p
                  v-if="
                    modelRepo[
                      item.value as keyof typeof modelRepo
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
        <h1 class="text-lg font-semibold">Code Agents</h1>
        <UTabs
          orientation="vertical"
          variant="link"
          class="w-full items-start"
          :default-value="defaultCodeAgent"
          :items="codeAgentItems"
        >
          <template #content="{ item }">
            <UForm
              :state="codeAgentSettings"
              class="flex flex-col relative gap-4"
            >
              <div class="flex items-center justify-between">
                <p class="text-center font-medium">{{ item.label }}</p>
                <USwitch
                  v-model="
                    codeAgentSettings[item.value as CodeAgent].useCustomModel
                  "
                  label="Use custom model"
                />
              </div>

              <UFormField label="Base URL" name="baseUrl">
                <UInput
                  v-model.trim="
                    codeAgentSettings[item.value as CodeAgent].baseUrl
                  "
                  placeholder="https://api.example.com"
                  class="w-full"
                  :disabled="
                    !codeAgentSettings[item.value as CodeAgent].useCustomModel
                  "
                />
              </UFormField>

              <UFormField label="Model" name="model">
                <UInput
                  v-model.trim="
                    codeAgentSettings[item.value as CodeAgent].model
                  "
                  placeholder="gpt-4, claude-3, etc."
                  class="w-full"
                  :disabled="
                    !codeAgentSettings[item.value as CodeAgent].useCustomModel
                  "
                />
              </UFormField>

              <UFormField label="API Key" name="apiKey">
                <UInput
                  v-model.trim="
                    codeAgentSettings[item.value as CodeAgent].apiKey
                  "
                  placeholder="Your API key"
                  class="w-full"
                  :disabled="
                    !codeAgentSettings[item.value as CodeAgent].useCustomModel
                  "
                />
              </UFormField>
            </UForm>
          </template>
        </UTabs>
      </div>
    </template>
    <template #mcp>
      <div class="mx-4 mb-4 flex flex-col gap-2">
        <p class="text-muted">Configure MCP servers</p>
      </div>
    </template>
  </UTabs>
</template>

<style lang="scss" scoped></style>
