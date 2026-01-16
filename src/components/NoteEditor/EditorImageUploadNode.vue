<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { writeFile } from '@/db-sqlite';
import { ref, watch } from 'vue';

const props = defineProps(nodeViewProps);

const file = ref<File | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const filePrefix = 'file://';

watch(file, async (newFile) => {
  if (!newFile) return;

  loading.value = true;
  error.value = null;

  try {
    // Store file in database
    const id = await writeFile(newFile);
    const fileUrl = `${filePrefix}${id}`;

    // Get current position
    const pos = props.getPos();
    if (typeof pos !== 'number') {
      loading.value = false;
      return;
    }

    // Replace upload node with actual image
    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: fileUrl })
      .run();
  } catch (err) {
    console.error('Failed to upload image:', err);
    error.value = err instanceof Error ? err.message : 'Failed to upload image';
    loading.value = false;
  }
});
</script>

<template>
  <NodeViewWrapper>
    <div class="image-upload-node">
      <UFileUpload
        v-model="file"
        accept="image/*"
        label="Upload an image"
        description="SVG, PNG, JPG or GIF (max. 10MB)"
        :preview="false"
        class="min-h-48"
      >
        <template #leading>
          <UAvatar
            :icon="loading ? 'i-lucide-loader-circle' : error ? 'i-lucide-alert-circle' : 'i-lucide-image'"
            size="xl"
            :color="error ? 'error' : 'neutral'"
            :ui="{ icon: [loading && 'animate-spin'] }"
          />
        </template>
      </UFileUpload>
      <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.image-upload-node {
  padding: 1rem;
}
</style>
