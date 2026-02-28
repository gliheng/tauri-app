<script setup lang="ts">
import { ref, onActivated } from "vue";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useTabsStore } from "@/stores/tabs";
import { useImagesStore } from "@/stores/images";
import ImageCreate from "@/components/Image/ImageCreate.vue";
import ImageDetail from "@/components/Image/ImageDetail.vue";
import type { ImageWithFile } from "@/db";

const tabsStore = useTabsStore();
const imagesStore = useImagesStore();
const overlay = useOverlay();

const selectedImage = ref<ImageWithFile | null>(null);
const detailModal = ref(false);

const imageCreateModal = overlay.create(ImageCreate);

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function openGenerate() {
  imageCreateModal.open({ initialImage: null });
}

function viewImage(image: ImageWithFile) {
  selectedImage.value = image;
  detailModal.value = true;
}

async function handleDelete(image: ImageWithFile) {
  try {
    const ok = await confirm("This action cannot be reverted. Are you sure?", {
      title: "Delete image",
      kind: "warning",
    });

    if (ok) {
      await imagesStore.deleteImage(image.id);
      await imagesStore.loadImages();
      detailModal.value = false;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

function handleUseParameters(image: ImageWithFile) {
  imageCreateModal.open({ initialImage: image });
}

onActivated(async () => {
  tabsStore.openTab('/image', 'Images');
  await imagesStore.loadImages();
});

const providerLabel: Record<string, string> = {
  openai: 'OpenAI',
  stability: 'Stability AI',
  replicate: 'Replicate',
  midjourney: 'Midjourney',
};
</script>

<template>
  <div class="size-full flex flex-col">
    <div class="flex items-center justify-between px-6 py-4">
      <h1 class="text-lg font-semibold">Images</h1>
      <UButton
        icon="i-lucide-plus"
        label="Generate"
        variant="subtle"
        @click="openGenerate"
      />
    </div>

    <div class="flex-1 overflow-auto p-6">
      <UEmpty
        v-if="imagesStore.images.length === 0"
        icon="i-lucide-image"
        title="No images found"
        description="Generate your first image to get started!"
        class="w-fit mx-auto"
      >
        <template #actions>
          <UButton
            icon="i-lucide-plus"
            label="Generate"
            @click="openGenerate"
          />
        </template>
      </UEmpty>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <UCard
          v-for="image in imagesStore.images"
          :key="image.id"
          class="transition-all hover:scale-[1.02] group"
          @click="viewImage(image)"
        >
          <div class="aspect-square bg-black/50 rounded overflow-hidden">
             <img
               :src="image.fileUrl"
               :alt="image.params.prompt"
               class="w-full h-full object-cover transition-transform group-hover:scale-110"
               loading="lazy"
             />
           </div>
           <div class="mt-3">
             <p class="text-sm line-clamp-2 mb-2">{{ image.params.prompt }}</p>
             <div class="flex items-center justify-between text-xs">
              <span>{{ providerLabel[image.provider] }} · {{ image.model }}</span>
              <span>{{ formatDate(image.updatedAt) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <ImageDetail
      v-model:open="detailModal"
      :image="selectedImage"
      @delete="handleDelete"
      @use-parameters="handleUseParameters"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
