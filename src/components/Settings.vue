<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { ref, computed } from "vue";
import { nanoid } from "nanoid";
import { useSettingsStore } from "@/stores/settings";
import { modelRepo } from "@/llm/models";
import { AgentProgram } from "@/db";
import McpServerModal from "@/components/McpServerModal.vue";
import McpImportModal from "@/components/McpImportModal.vue";
import type { McpServer } from "@/types/mcp";

const tabItems = [
  {
    label: "Models",
    icon: "i-mdi-form-select",
    slot: "models" as const,
  },
  {
    label: "Web Search",
    icon: "i-lucide-search",
    slot: "tavily" as const,
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
  {
    label: "OpenCode",
    value: "opencode",
  },
] satisfies TabsItem[];

const defaultAgent = "codex";

const { modelSettings, agentSettings, chatSettings, webSearchSettings, mcpServers } = storeToRefs(useSettingsStore());

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

// MCP Server Modal setup
const overlay = useOverlay();
const mcpServerModal = overlay.create(McpServerModal);
const mcpImportModal = overlay.create(McpImportModal);

// MCP server operations
const addMcpServer = async () => {
  const server = await mcpServerModal.open() as McpServer | null;
  if (!server) return;

  mcpServers.value[server.id] = {
    ...server,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const editMcpServer = async (serverId: string) => {
  const existing = mcpServers.value[serverId];
  if (!existing) return;

  const server = await mcpServerModal.open({ server: existing }) as McpServer | null;
  if (!server) return;

  mcpServers.value[serverId] = {
    ...server,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
};

const deleteMcpServer = (serverId: string) => {
  delete mcpServers.value[serverId];
};

const getServerIcon = (server: McpServer) => {
  switch (server.config.type) {
    case 'stdio': return 'i-lucide-terminal';
    case 'http': return 'i-lucide-globe';
    case 'sse': return 'i-lucide-radio';
  }
};

const getServerTypeLabel = (type: string) => {
  return type.toUpperCase();
};

// Import MCP servers from JSON (Claude Desktop format)
const importMcpServers = async () => {
  const jsonContent = await mcpImportModal.open() as string | null;
  if (!jsonContent) return;

  try {
    const json = JSON.parse(jsonContent);

    // Support Claude Desktop MCP format
    const serversToImport: Array<{ name: string; config: McpServer['config'] }> = [];

    // Claude Desktop format: { "mcpServers": { "server-id": { "command": "...", "args": [...] } } }
    if (json.mcpServers) {
      for (const [name, serverConfig] of Object.entries(json.mcpServers)) {
        const config = serverConfig as any;

        // Check if it's stdio type (has command)
        if (config.command) {
          serversToImport.push({
            name,
            config: {
              type: 'stdio',
              name,
              command: config.command,
              args: config.args || [],
              env: Object.entries(config.env || {}).map(([name, value]) => ({
                name,
                value: String(value)
              }))
            }
          });
        }
      }
    }

    // Import servers
    let imported = 0;
    for (const { config } of serversToImport) {
      // Generate unique ID using nanoid
      const id = nanoid();

      mcpServers.value[id] = {
        id,
        config,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      imported++;
    }

    if (imported > 0) {
      alert(`Successfully imported ${imported} MCP server(s)`);
    } else if (serversToImport.length > 0) {
      alert('No servers imported (all servers already exist)');
    } else {
      alert('No valid MCP servers found in JSON');
    }
  } catch (error) {
    console.error('Failed to import MCP servers:', error);
    alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const currentTab = ref(defaultAgent);
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
          </div>
          <h2 class="text-lg font-semibold mt-4">Agent Program</h2>
          <div class="flex-1 min-h-0">
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
                </UForm>
              </template>
            </UTabs>
          </div>
        </div>
      </Scrollbar>
    </template>
    <template #tavily>
      <h1 class="text-xl font-semibold py-4">Tavily Search</h1>
      <Scrollbar class="flex-1 min-h-0">
        <div class="pr-4 py-4">
          <UForm :state="webSearchSettings" class="flex flex-col gap-4">
            <UFormField label="API Key" name="apiKey">
              <UInput
                v-model.trim="webSearchSettings.apiKey"
                placeholder="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                class="w-full"
              />
            </UFormField>
            <p class="text-sm text-muted">
              Enter your Tavily API key to enable web search in chat.
              Get your API key from <a href="https://tavily.com" target="_blank" class="text-primary underline">tavily.com</a>
            </p>
          </UForm>
        </div>
      </Scrollbar>
    </template>
    <template #mcp>
      <h1 class="text-xl font-semibold py-4">MCP Servers</h1>
      <Scrollbar class="flex-1 min-h-0">
        <div class="pr-4 py-4 space-y-4">
          <!-- Action Buttons -->
          <div class="flex gap-2 justify-center">
            <UFieldGroup>
              <UButton
                icon="i-lucide-plus"
                label="Add Server"
                color="primary"
                @click="addMcpServer"
              />
              <UButton
                icon="i-lucide-upload"
                label="Import JSON"
                variant="outline"
                @click="importMcpServers"
              />
            </UFieldGroup>
          </div>

          <!-- Server List -->
          <div v-if="Object.keys(mcpServers).length > 0" class="space-y-2">
            <div
              v-for="(server, serverId) in mcpServers"
              :key="serverId"
              class="flex items-center gap-3 p-3 bg-elevated rounded-lg border"
              :class="{ 'opacity-50': !server.enabled }"
            >
              <!-- Icon -->
              <div class="flex-shrink-0">
                <div :class="getServerIcon(server)" class="text-xl" />
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ server.config.name }}</div>
                <div v-if="server.config.description" class="text-sm text-muted truncate">
                  {{ server.config.description }}
                </div>
                <div class="text-sm text-muted flex items-center gap-2">
                  <span>{{ getServerTypeLabel(server.config.type) }}</span>
                  <span v-if="!server.enabled" class="text-xs text-warning">(disabled)</span>
                </div>
                <!-- Type-specific details -->
                <div v-if="server.config.type === 'stdio'" class="text-xs text-muted">
                  {{ server.config.command }}
                </div>
                <div v-else class="text-xs text-muted truncate">
                  {{ server.config.url }}
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click="editMcpServer(serverId)"
                />
                <UButton
                  icon="i-lucide-trash"
                  variant="ghost"
                  color="error"
                  size="sm"
                  @click="deleteMcpServer(serverId)"
                />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12 text-muted">
            <div class="text-4xl mb-2 i-mdi-server" />
            <p class="text-lg font-medium mb-1">No MCP Servers</p>
            <p class="text-sm">Add a server to extend agent capabilities</p>
          </div>
        </div>
      </Scrollbar>
    </template>
  </UTabs>
</template>

<style lang="scss" scoped></style>
