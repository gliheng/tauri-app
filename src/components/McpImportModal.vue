<script setup lang="ts">
import { ref } from "vue";
import Editor from "@/components/CodeEditor/Editor.vue";

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
  <UModal>
    <template #content>
      <div class="size-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Import MCP Servers from JSON</h2>
          <UButton
            icon="i-lucide-info"
            variant="ghost"
            size="sm"
            @click="insertSample"
          >
            Insert Sample
          </UButton>
        </div>

        <p class="text-sm text-muted">
          Paste your MCP server configuration in JSON format (Claude Desktop format supported).
        </p>

        <!-- JSON Editor -->
        <div class="border rounded-lg overflow-hidden" :class="{ 'border-error': !!validationError }">
          <Editor
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
