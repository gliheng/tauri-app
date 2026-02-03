<script setup lang="ts">
import type { McpTool } from '@/stores/mcp';

const props = defineProps<{
  serverName: string;
  tools: McpTool[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const formatSchema = (schema: any) => {
  if (!schema) return 'No schema';
  return JSON.stringify(schema, null, 2);
};
</script>

<template>
  <UModal :close="{ onClick: () => emit('close') }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="i-lucide-wrench text-xl" />
        <div>
          <div class="font-semibold">MCP Tools</div>
          <div class="text-sm text-muted">{{ serverName }} ({{ tools.length }} tool{{ tools.length !== 1 ? 's' : '' }})</div>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="tools.length === 0" class="text-center py-8 text-muted">
        <div class="i-lucide-inbox text-4xl mb-2" />
        <p>No tools available</p>
      </div>

      <div v-else class="space-y-2">
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
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Close" @click="emit('close')" />
      </div>
    </template>
  </UModal>
</template>
