<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { ref, watch, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settings";
import { modelRepo } from "@/llm/models";
import { AgentProgram } from "@/db-sqlite";

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
    label: "Siliconflow",
    value: "siliconflow",
  },
] satisfies TabsItem[];

const defaultProvider = "deepseek";

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
  // {
  //   label: "OpenCode",
  //   value: "opencode",
  // },
] satisfies TabsItem[];

const defaultAgent = "codex";

const { modelSettings, agentSettings, chatSettings } = storeToRefs(useSettingsStore());

const modelList = computed(() => {
  const models: Array<{ label: string; value: string; provider: string }> = [];
  
  for (const [provider, config] of Object.entries(modelSettings.value)) {
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

const currentTab = ref(defaultAgent);
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
    content: 'pl-4 flex flex-col',
  }">
    <template #list-leading>
      <h1 class="text-xl font-semibold pl-3 py-4">Settings</h1>
    </template>
    <template #models>
      <h1 class="text-xl font-semibold py-4">Models</h1>
      <Scrollbar class="flex-1 min-h-0">
        <div class="pr-4 py-4">
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
            <h2 class="text-lg font-semibold">Agent Program</h2>
            <UTabs
              orientation="vertical"
              variant="link"
              class="w-full items-start"
              v-model="currentTab"
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
                      v-model="
                        agentSettings[item.value as AgentProgram].useCustomModel
                      "
                      label="Use custom model"
                    />
                  </div>

                  <template v-if="item.value !== 'opencode'">
                    <UFormField label="Base URL" name="baseUrl">
                      <UInput
                        v-model.trim="
                          agentSettings[item.value as AgentProgram].baseUrl
                        "
                        placeholder="https://api.example.com"
                        class="w-full"
                        :disabled="
                          !agentSettings[item.value as AgentProgram].useCustomModel
                        "
                      />
                    </UFormField>

                    <UFormField label="Model" name="model">
                      <UInput
                        v-model.trim="
                          agentSettings[item.value as AgentProgram].model
                        "
                        placeholder="gpt-4, claude-3, etc."
                        class="w-full"
                        :disabled="
                          !agentSettings[item.value as AgentProgram].useCustomModel
                        "
                      />
                    </UFormField>

                    <UFormField label="API Key" name="apiKey">
                      <UInput
                        v-model.trim="
                          agentSettings[item.value as AgentProgram].apiKey
                        "
                        placeholder="Your API key"
                        class="w-full"
                        :disabled="
                          !agentSettings[item.value as AgentProgram].useCustomModel
                        "
                      />
                    </UFormField>
                  </template>

                  <template v-else-if="item.value === 'opencode'">
                    <UFormField label="Select Model">
                      <USelectMenu
                        v-model="agentSettings.opencode.model"
                        :items="opencodeModels"
                        :loading="loadingOpencodeModels"
                        :disabled="
                          !agentSettings.opencode?.useCustomModel
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
      </Scrollbar>
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
