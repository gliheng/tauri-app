<script setup lang="ts">
import { computed, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { type ContentBlock } from '@agentclientprotocol/sdk';
import { SelectionContext, useArtifactsStore } from '@/stores/artifacts';
import { isTextFile } from '@/utils/file';
import dedent from 'dedent';
import mime from 'mime';

const props = defineProps<{
  artifactKey: string;
}>();

const artifactsStore = useArtifactsStore();
const isVisible = ref(true);

const context = computed(() => artifactsStore.getContext(props.artifactKey));

/**
 * Build content blocks for the selection context
 */
async function buildContextParts(baseDirectory: string): Promise<ContentBlock[]> {
  const parts: ContentBlock[] = [];
  const ctx = context.value;

  if (!ctx) return parts;

  if (ctx.selection && ctx.file) {
    const start = ctx.selection.start - 1;
    const end = ctx.selection.end;

    // Read file content and extract selection range
    const fileContent = await invoke('read_file_by_range', {
      path: `${baseDirectory}/${ctx.file.path}`,
      start,
      end,
    });

    parts.push({
      type: 'text',
      text: dedent`
        @${ctx.file.path}
        \`\`\`
        ${fileContent}
        \`\`\`
      `,
    });
  }

  if (ctx.file) {
    const mimeType = mime.getType(ctx.file.path) || 'text/plain';
    parts.push({
      type: 'resource',
      resource: {
        uri: `file://${baseDirectory}/${ctx.file.path}`,
        mimeType,
        [isTextFile(mimeType) ? 'text' : 'blob']: '',
      } as any,
    });
  }

  return parts;
}

const contextText = computed(() => {
  const ctx = context.value;
  if (!ctx) return null;

  const parts: string[] = [];

  let lineCount = 0;
  if (ctx.selection) {
    const { start, end } = ctx.selection;
    if (start == end) {
      lineCount = 1;
    } else {
      lineCount = end - start + 1;
    }
  }
  if (lineCount > 0) {
    parts.push(`Lines: ${lineCount}`);
  } else if (ctx.file?.path) {
    const fileName = ctx.file.path.split('/').pop() || ctx.file.path;
    parts.push(`${fileName}`);
  }

  return parts.length > 0 ? parts.join(' • ') : null;
});

const eyeIcon = computed(() => isVisible.value ? 'i-lucide-eye' : 'i-lucide-eye-off');

function toggleEye() {
  isVisible.value = !isVisible.value;
}

function getContext(): SelectionContext | undefined {
  if (!isVisible.value) return;

  return context.value;
}

defineExpose({
  isVisible,
  getContext,
  buildContextParts,
});
</script>

<template>
  <UTooltip v-if="contextText" text="Toggle context visibility">
    <UButton
      size="sm"
      class="max-w-40"
      color="primary"
      variant="soft"
      :trailing-icon="eyeIcon"
      @click.stop="toggleEye"
    >
      <span class="truncate">
        {{ isVisible ? contextText : 'Context hidden' }}
      </span>
    </UButton>
  </UTooltip>
</template>

<style lang="scss" scoped>
:deep(.button) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
</style>
