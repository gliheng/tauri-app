<script setup lang="ts">
import { computed } from "vue";
import type { ImageWithFile } from "@/db";

const props = defineProps<{
  image: ImageWithFile | null;
}>();

const emit = defineEmits<{
  delete: [image: ImageWithFile];
  useParameters: [image: ImageWithFile];
}>();

const open = defineModel<boolean>('open');

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const providerLabel = computed(() => {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    stability: 'Stability AI',
    replicate: 'Replicate',
    midjourney: 'Midjourney',
  };
  return labels;
});

function handleDelete() {
  if (props.image) {
    emit('delete', props.image);
  }
}

function handleUseParameters() {
  if (props.image) {
    emit('useParameters', props.image);
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div v-if="image" class="size-full flex flex-col overflow-y-auto">
        <div class="flex-1 overflow-auto p-6">
          <div class="max-w-4xl mx-auto">
            <div class="aspect-square bg-black/50 rounded-lg overflow-hidden mb-6">
              <img
                :src="image.fileUrl"
                :alt="image.params.prompt"
                class="w-full h-full object-contain"
              />
            </div>

            <UCard>
              <div class="space-y-4">
                <div v-if="image.params.prompt">
                  <h3 class="text-sm font-medium mb-2">Prompt</h3>
                  <p>{{ image.params.prompt }}</p>
                </div>

                <div v-if="image.params.negativePrompt">
                  <h3 class="text-sm font-medium mb-2">Negative Prompt</h3>
                  <p>{{ image.params.negativePrompt }}</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p class="mb-1">Provider</p>
                    <p>{{ providerLabel[image.provider] }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Model</p>
                    <p>{{ image.model }}</p>
                  </div>
                  <div v-if="image.params.size">
                    <p class="mb-1">Size</p>
                    <p>{{ image.params.size }}</p>
                  </div>
                  <div v-if="image.params.seed !== undefined">
                    <p class="mb-1">Seed</p>
                    <p>{{ image.params.seed }}</p>
                  </div>
                </div>

                <div class="text-sm text-dimmed">
                  <p>Created {{ formatDate(image.createdAt) }}</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div class="p-4 flex gap-3 justify-end">
          <UButton
            variant="solid"
            @click="handleUseParameters"
          >
            Use Parameters
          </UButton>
          <UButton
            icon="i-heroicons-trash"
            color="error"
            @click="handleDelete"
          >
            Delete
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
