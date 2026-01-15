<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
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
  // {
  //   label: "OpenCode",
  //   value: "opencode",
  // },
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

const currentTab = ref(defaultCodeAgent);
const opencodeModels = ref<{ label: string; value: string }[]>([]);
const loadingOpencodeModels = ref(false);

const fetchOpencodeModels = async () => {
  loadingOpencodeModels.value = true;
  try {
    const result = await invoke<{ models: string[] }>('get_opencode_models');
    opencodeModels.value = result.models.map(m => ({
      label: m,
      value: m
    }));
  } catch (error) {
    console.error('Failed to fetch opencode models:', error);
  } finally {
    loadingOpencodeModels.value = false;
  }
};

watch(currentTab, async (tab) => {
  if (tab === 'opencode') {
    await fetchOpencodeModels();
  }
}, { immediate: true });
</script>

<template>
  <UTabs :items="tabItems" orientation="vertical" variant="link" :ui="{
    root: 'size-full flex-1 items-stretch gap-0',
    list: 'self-stretch bg-elevated min-w-40 p-0',
    indicator: 'hidden',
    content: 'pl-4 flex flex-col gap-2',
  }">
    <template #list-leading>
      <h1 class="text-xl font-semibold pl-3 py-4">Settings</h1>
    </template>
    <template #models>
      <h1 class="text-xl font-semibold py-4">Models</h1>
      <div class="flex-1 flex flex-col gap-2 min-h-0 overflow-auto pr-2">
        <h2 class="text-lg font-semibold">Chat Models</h2>
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
                    <UButton
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
                      @click="toggleModel(item.value, modelValue)"
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
          <h2 class="text-lg font-semibold">Code Agents</h2>
          <UTabs
            orientation="vertical"
            variant="link"
            class="w-full items-start"
            v-model="currentTab"
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

                <template v-if="item.value !== 'opencode'">
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
                </template>

                <template v-else-if="item.value === 'opencode'">
                  <UFormField label="Select Model">
                    <USelectMenu
                      v-model="codeAgentSettings.opencode.model"
                      :items="opencodeModels"
                      :loading="loadingOpencodeModels"
                      :disabled="
                        !codeAgentSettings.opencode?.useCustomModel
                      "
                      virtualize
                      valueKey="value"
                      placeholder="Select a model"
                      class="w-full"
                    />
                  </UFormField>
                </template>
                </UForm>
            </template>
          </UTabs>
        </div>
      </div>
    </template>
    <template #mcp>
      <h1 class="text-xl font-semibold py-4">MCP</h1>
      <div class="flex-1 flex flex-col gap-2 min-h-0 overflow-auto">
        <p class="text-muted">Configure MCP servers</p>
      </div>
    </template>
  </UTabs>
</template>

<style lang="scss" scoped></style>
