<script setup lang="ts">
import { computed, ref } from 'vue';
import { SelectionContext, useArtifactsStore } from '@/stores/artifacts';

const props = defineProps<{
  artifactKey: string;
}>();

const artifactsStore = useArtifactsStore();
const isVisible = ref(true);

const context = computed(() => artifactsStore.getContext(props.artifactKey));

const contextText = computed(() => {
  const ctx = context.value;
  if (!ctx) return null;

  const parts: string[] = [];

  if (ctx.file?.path) {
    parts.push(`${ctx.file.path}`);
  }

  if (ctx.cursor) {
    const { line, column } = ctx.cursor;
    parts.push(`Ln ${line}, Col ${column}`);
  }

  if (ctx.selection) {
    const { start, end } = ctx.selection;
    parts.push(`Sel: ${start}-${end}`);
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
});
</script>

<template>
  <UButton
    v-if="contextText"
    size="sm"
    color="primary"
    variant="soft"
    :trailing-icon="eyeIcon"
    @click.stop="toggleEye"
  >
    {{ isVisible ? contextText : 'Context hidden' }}
  </UButton>
</template>

<style lang="scss" scoped>
:deep(.button) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
</style>
