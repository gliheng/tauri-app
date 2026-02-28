<script setup lang="ts">
import { ref } from "vue";
import CodeEditor from "@/components/WorkspaceEditor/CodeEditor.vue";

const emit = defineEmits<{
  close: [json: string | null];
}>();

const jsonContent = ref('');
const validationError = ref('');

const sampleJson = `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    }
  }
}`;

const insertSample = () => {
  jsonContent.value = sampleJson;
  validationError.value = '';
};

const importJson = () => {
  if (!jsonContent.value.trim()) {
    emit('close', null);
    return;
  }

  // Validate JSON
  try {
    JSON.parse(jsonContent.value);
    validationError.value = '';
    emit('close', jsonContent.value);
  } catch (error) {
    validationError.value = error instanceof Error ? error.message : 'Invalid JSON format';
  }
};

const cancel = () => {
  emit('close', null);
};
</script>

<template>
  <UModal title="Import MCP Servers from JSON" description="Paste your MCP server configuration in JSON format (Claude Desktop format supported)">
    <template #content>
      <div class="size-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-info"
            variant="ghost"
            size="sm"
            @click="insertSample"
          >
            Insert Sample
          </UButton>
        </div>

        <div class="border rounded-lg overflow-hidden" :class="{ 'border-error': !!validationError }">
          <CodeEditor
            v-model="jsonContent"
            language="json"
            height="300px"
          />
        </div>

        <p v-if="validationError" class="text-sm text-error">
          {{ validationError }}
        </p>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" variant="outline" @click="cancel" />
          <UButton
            label="Import"
            color="primary"
            :disabled="!jsonContent.trim()"
            @click="importJson"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
