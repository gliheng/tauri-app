<script setup lang="ts">
import { ref } from 'vue';
import type { McpTool, McpResource, McpPrompt } from '@/stores/mcp';

const props = defineProps<{
  serverName: string;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const activeTab = ref<'tools' | 'resources' | 'prompts'>('tools');

const formatSchema = (schema: any) => {
  if (!schema) return 'No schema';
  return JSON.stringify(schema, null, 2);
};
</script>

<template>
  <UModal :close="{ onClick: () => emit('close') }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="i-lucide-cpu text-xl" />
        <div>
          <div class="font-semibold">MCP Server Details</div>
          <div class="text-sm text-muted">{{ serverName }}</div>
        </div>
      </div>
    </template>

    <template #body>
      <!-- Tabs -->
      <div class="flex gap-2 mb-4">
        <UButton
          :variant="activeTab === 'tools' ? 'solid' : 'outline'"
          :label="`Tools (${tools.length})`"
          @click="activeTab = 'tools'"
        />
        <UButton
          :variant="activeTab === 'resources' ? 'solid' : 'outline'"
          :label="`Resources (${resources.length})`"
          @click="activeTab = 'resources'"
        />
        <UButton
          :variant="activeTab === 'prompts' ? 'solid' : 'outline'"
          :label="`Prompts (${prompts.length})`"
          @click="activeTab = 'prompts'"
        />
      </div>

      <!-- Tools Tab -->
      <div v-if="activeTab === 'tools'" class="space-y-2">
        <div v-if="tools.length === 0" class="text-center py-8 text-muted">
          <div class="i-lucide-inbox text-4xl mb-2" />
          <p>No tools available</p>
        </div>

        <UCollapsible
          v-for="tool in tools"
          :key="tool.name"
          class="border border-accented rounded-lg overflow-hidden"
        >
          <template #default="{ open }">
            <div class="p-3 cursor-pointer hover:bg-elevated transition-colors">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium font-mono text-sm">{{ tool.name }}</div>
                  <div v-if="tool.description" class="text-sm text-muted mt-1">
                    {{ tool.description }}
                  </div>
                </div>
                <div
                  class="i-lucide-chevron-down text-lg transition-transform"
                  :class="{ 'rotate-180': open }"
                />
              </div>
            </div>
          </template>

          <template #content>
            <div class="border-t bg-elevated p-3">
              <div class="text-xs font-semibold text-muted mb-2">Input Schema</div>
              <pre class="text-xs bg-base p-2 rounded overflow-x-auto">{{ formatSchema(tool.input_schema) }}</pre>
            </div>
          </template>
        </UCollapsible>
      </div>

      <!-- Resources Tab -->
      <div v-if="activeTab === 'resources'" class="space-y-2">
        <div v-if="resources.length === 0" class="text-center py-8 text-muted">
          <div class="i-lucide-inbox text-4xl mb-2" />
          <p>No resources available</p>
        </div>

        <UCollapsible
          v-for="resource in resources"
          :key="resource.uri"
          class="border border-accented rounded-lg overflow-hidden"
        >
          <template #default="{ open }">
            <div class="p-3 cursor-pointer hover:bg-elevated transition-colors">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium font-mono text-sm">{{ resource.name }}</div>
                  <div class="text-xs text-muted font-mono mt-1">{{ resource.uri }}</div>
                  <div v-if="resource.description" class="text-sm text-muted mt-1">
                    {{ resource.description }}
                  </div>
                  <div v-if="resource.mimeType" class="text-xs text-accent mt-1">
                    Type: {{ resource.mimeType }}
                  </div>
                </div>
                <div
                  class="i-lucide-chevron-down text-lg transition-transform"
                  :class="{ 'rotate-180': open }"
                />
              </div>
            </div>
          </template>
        </UCollapsible>
      </div>

      <!-- Prompts Tab -->
      <div v-if="activeTab === 'prompts'" class="space-y-2">
        <div v-if="prompts.length === 0" class="text-center py-8 text-muted">
          <div class="i-lucide-inbox text-4xl mb-2" />
          <p>No prompts available</p>
        </div>

        <UCollapsible
          v-for="prompt in prompts"
          :key="prompt.name"
          class="border border-accented rounded-lg overflow-hidden"
        >
          <template #default="{ open }">
            <div class="p-3 cursor-pointer hover:bg-elevated transition-colors">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium font-mono text-sm">{{ prompt.name }}</div>
                  <div v-if="prompt.description" class="text-sm text-muted mt-1">
                    {{ prompt.description }}
                  </div>
                  <div v-if="prompt.arguments.length > 0" class="text-xs text-accent mt-1">
                    {{ prompt.arguments.length }} argument(s)
                  </div>
                </div>
                <div
                  class="i-lucide-chevron-down text-lg transition-transform"
                  :class="{ 'rotate-180': open }"
                />
              </div>
            </div>
          </template>

          <template #content>
            <div class="border-t bg-elevated p-3">
              <div v-if="prompt.arguments.length > 0" class="text-xs font-semibold text-muted mb-2">
                Arguments
              </div>
              <div
                v-for="arg in prompt.arguments"
                :key="arg.name"
                class="mb-2 last:mb-0"
              >
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm">{{ arg.name }}</span>
                  <span v-if="arg.required" class="text-xs text-warning">required</span>
                </div>
                <div v-if="arg.description" class="text-xs text-muted mt-1">
                  {{ arg.description }}
                </div>
              </div>
            </div>
          </template>
        </UCollapsible>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Close" @click="emit('close')" />
      </div>
    </template>
  </UModal>
</template>
