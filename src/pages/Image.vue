<script setup lang="ts">
import { ref, onMounted, watch, onActivated } from "vue";
import { nanoid } from "nanoid";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { useTabsStore } from "@/stores/tabs";
import { MODELS_BY_PROVIDER } from "@/constants";

const tabsStore = useTabsStore();

// ============================================
// Mock API Functions (inline implementation)
// ============================================

type ImageGenerationRequest = {
  provider: string;
  model: string;
  size: string;
  prompt: string;
  negativePrompt?: string;
  seed: number;
  numImages: number;
};

type GeneratedImage = {
  url: string;
};

// Mock image generation using placeholder image services
const generateMockImage = async (
  request: ImageGenerationRequest
): Promise<GeneratedImage[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

  const [width, height] = request.size.split("x").map(Number);
  const results: GeneratedImage[] = [];

  // Generate mock images using placeholder services
  for (let i = 0; i < request.numImages; i++) {
    const seed = request.seed === -1 ? Math.floor(Math.random() * 999999) : request.seed + i;

    // Use picsum.photos for realistic-looking placeholder images
    const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;

    results.push({ url });
  }

  return results;
};

// ============================================
// Local Storage Functions (replacing database)
// ============================================

const STORAGE_KEY = "image-gallery";

const getStoredImages = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveStoredImages = (images: any[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch (error) {
    console.error("Error saving images to localStorage:", error);
  }
};

const addStoredImage = (image: any) => {
  const images = getStoredImages();
  images.unshift(image);
  saveStoredImages(images);
};

const removeStoredImage = (imageId: string) => {
  const images = getStoredImages();
  const filtered = images.filter((img: any) => img.id !== imageId);
  saveStoredImages(filtered);
};

// Parameter state
const selectedProvider = ref("openai");
const selectedModel = ref("dall-e-3");
const selectedSize = ref("1024x1024");
const prompt = ref("");
const negativePrompt = ref("");
const seed = ref<number>(-1); // -1 means random
const numImages = ref(1);

// Available options
const providers = [
  { label: "OpenAI (DALL-E)", value: "openai" },
  { label: "Stability AI", value: "stability" },
  { label: "Replicate", value: "replicate" },
  { label: "Midjourney", value: "midjourney" },
];

const sizesByModel: Record<string, { label: string; value: string }[]> = {
  "dall-e-3": [
    { label: "1024×1024", value: "1024x1024" },
    { label: "1792×1024 (Wide)", value: "1792x1024" },
    { label: "1024×1792 (Tall)", value: "1024x1792" },
  ],
  "dall-e-2": [
    { label: "1024×1024", value: "1024x1024" },
    { label: "512×512", value: "512x512" },
    { label: "256×256", value: "256x256" },
  ],
  default: [
    { label: "1024×1024", value: "1024x1024" },
    { label: "512×512", value: "512x512" },
    { label: "768×768", value: "768x768" },
    { label: "512×768", value: "512x768" },
    { label: "768×512", value: "768x512" },
  ],
};

// Generation state
const isGenerating = ref(false);
const currentImages = ref<Array<{ id: string; url: string; prompt: string }>>([]);

// Gallery state - store all generated images
const galleryImages = ref<
  Array<{
    id: string;
    provider: string;
    model: string;
    size: string;
    prompt: string;
    negativePrompt: string;
    seed: number;
    url: string;
    timestamp: number;
  }>
>([]);

// Selected image in gallery
const selectedGalleryImage = ref<typeof galleryImages.value[0] | null>(null);

// Panel sizes
const generatePanelSize = ref(40);
const currentPanelSize = ref(30);
const galleryPanelSize = ref(30);

onActivated(() => {
  tabsStore.openTab(`/image`, "Image Generation");
});

// Load from localStorage on mount
onMounted(() => {
  // Load images from localStorage
  try {
    const savedImages = getStoredImages();
    galleryImages.value = savedImages;
  } catch (error) {
    console.error("Error loading images from localStorage:", error);
  }
});

// Save to localStorage
watch(
  galleryImages,
  () => {
    saveStoredImages(galleryImages.value);
  },
  { deep: true }
);

// Watch provider change to update model options
watch(selectedProvider, (newProvider) => {
  const models = MODELS_BY_PROVIDER[newProvider] || MODELS_BY_PROVIDER.openai;
  if (models.length > 0) {
    selectedModel.value = models[0].value;
  }
});

// Watch model change to update size options
watch(selectedModel, (newModel) => {
  const sizes = sizesByModel[newModel] || sizesByModel.default;
  if (sizes.length > 0) {
    selectedSize.value = sizes[0].value;
  }
});

// Get available models for current provider
const availableModels = () =>
  MODELS_BY_PROVIDER[selectedProvider.value] || MODELS_BY_PROVIDER.openai;

// Get available sizes for current model
const availableSizes = () =>
  sizesByModel[selectedModel.value] || sizesByModel.default;

// Generate images using mock API
const generateImages = async () => {
  if (!prompt.value.trim()) return;

  isGenerating.value = true;

  try {
    const request: ImageGenerationRequest = {
      provider: selectedProvider.value,
      model: selectedModel.value,
      size: selectedSize.value,
      prompt: prompt.value,
      negativePrompt: negativePrompt.value || undefined,
      seed: seed.value,
      numImages: numImages.value,
    };

    // Call mock API
    const mockResults = await generateMockImage(request);
    const newImages: typeof galleryImages.value[0][] = [];
    const actualSeed = seed.value === -1 ? Math.floor(Math.random() * 999999) : seed.value;

    for (let i = 0; i < mockResults.length; i++) {
      const imageId = nanoid();
      const imageData: typeof galleryImages.value[0] = {
        id: imageId,
        provider: selectedProvider.value,
        model: selectedModel.value,
        size: selectedSize.value,
        prompt: prompt.value,
        negativePrompt: negativePrompt.value,
        seed: actualSeed + i,
        url: mockResults[i].url,
        timestamp: Date.now(),
      };

      newImages.push(imageData);

      // Save to localStorage
      addStoredImage(imageData);
    }

    galleryImages.value = [...newImages, ...galleryImages.value];
    currentImages.value = newImages.map((img) => ({ id: img.id, url: img.url, prompt: img.prompt }));
  } catch (error) {
    console.error("Error generating images:", error);
  } finally {
    isGenerating.value = false;
  }
};

// Select an image from gallery
const selectGalleryImage = (image: typeof galleryImages.value[0]) => {
  selectedGalleryImage.value = image;
};

// Delete an image from gallery
const deleteGalleryImage = (imageId: string) => {
  const index = galleryImages.value.findIndex((img) => img.id === imageId);
  if (index !== -1) {
    galleryImages.value.splice(index, 1);
    if (selectedGalleryImage.value?.id === imageId) {
      selectedGalleryImage.value = null;
    }

    // Delete from localStorage
    removeStoredImage(imageId);
  }
};

// Copy image parameters to input form
const useImageParameters = (image: typeof galleryImages.value[0]) => {
  selectedProvider.value = image.provider;
  selectedModel.value = image.model;
  selectedSize.value = image.size;
  prompt.value = image.prompt;
  negativePrompt.value = image.negativePrompt;
  seed.value = image.seed;
};
</script>

<template>
  <div class="size-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <h1 class="text-lg font-semibold">Image Generation</h1>
    </div>

    <!-- Main Content with Splitter -->
    <div class="flex-1 flex overflow-hidden">
      <SplitterGroup direction="horizontal" class="flex-1">
        <!-- Generate Panel -->
        <SplitterPanel :default-size="40" :min-size="20">
          <div class="flex flex-col h-full border-r border-white/10">
            <header class="p-3 border-b border-white/10">
              <h2 class="text-sm font-medium">Generate</h2>
            </header>
            <div class="flex-1 overflow-auto p-4">
              <div class="flex flex-col gap-4 max-w-2xl mx-auto">
                <!-- Provider & Model Selection -->
                <UCard class="bg-white/5 border-white/10">
                  <div class="space-y-4">
                    <!-- Provider -->
                    <UFormField label="Provider">
                      <USelectMenu v-model="selectedProvider" :items="providers" value-key="value" />
                    </UFormField>

                    <!-- Model -->
                    <UFormField label="Model">
                      <USelectMenu v-model="selectedModel" :items="availableModels()" value-key="value" />
                    </UFormField>

                    <!-- Size -->
                    <UFormField label="Size">
                      <USelectMenu v-model="selectedSize" :items="availableSizes()" value-key="value" />
                    </UFormField>

                    <!-- Number of Images -->
                    <UFormField label="Number of Images">
                      <div class="flex items-center gap-4">
                        <USlider v-model="numImages" :min="1" :max="4" :step="1" class="flex-1" />
                        <span class="w-8 text-center">{{ numImages }}</span>
                      </div>
                    </UFormField>

                    <!-- Seed -->
                    <UFormField label="Seed (-1 for random)">
                      <UInput v-model.number="seed" type="number" placeholder="-1" />
                    </UFormField>
                  </div>
                </UCard>

                <!-- Prompts -->
                <UCard class="bg-white/5 border-white/10">
                  <UForm class="space-y-4">
                    <!-- Positive Prompt -->
                    <UFormField label="Prompt">
                      <UTextarea
                        v-model="prompt"
                        placeholder="Describe the image you want to generate..."
                        :rows="4"
                        class="resize-none"
                      />
                    </UFormField>

                    <!-- Negative Prompt -->
                    <UFormField label="Negative Prompt">
                      <UTextarea
                        v-model="negativePrompt"
                        placeholder="What to avoid in the image..."
                        :rows="2"
                        class="resize-none"
                      />
                    </UFormField>
                  </UForm>
                </UCard>

                <!-- Generate Button -->
                <UButton
                  size="lg"
                  class="w-full"
                  :disabled="!prompt.trim() || isGenerating"
                  @click="generateImages"
                >
                  <template v-if="isGenerating">
                    <span class="animate-pulse">Generating...</span>
                  </template>
                  <template v-else> Generate Images </template>
                </UButton>
              </div>
            </div>
          </div>
        </SplitterPanel>

        <SplitterResizeHandle class="w-0.5 splitter-handle" />

        <!-- Current & Gallery Panel -->
        <SplitterPanel>
          <SplitterGroup direction="vertical" class="h-full">
            <!-- Current Images Panel -->
            <SplitterPanel :default-size="50" :min-size="20">
              <div class="flex flex-col h-full">
                <header class="p-3 border-b border-white/10">
                  <h2 class="text-sm font-medium">
                    Current <span v-if="currentImages.length > 0" class="text-white/50">({{ currentImages.length }})</span>
                  </h2>
                </header>
                <div class="flex-1 overflow-auto p-4">
                  <div v-if="currentImages.length === 0" class="flex items-center justify-center h-full text-white/50">
                    <p>No images generated yet.</p>
                  </div>
                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UCard
                      v-for="image in currentImages"
                      :key="image.id"
                      class="bg-white/5 border-white/10 overflow-hidden"
                    >
                      <div class="aspect-square bg-black/50 rounded flex items-center justify-center">
                        <img :src="image.url" :alt="image.prompt" class="max-w-full max-h-full object-contain" />
                      </div>
                      <p class="mt-2 text-sm text-white/70 line-clamp-2">{{ image.prompt }}</p>
                    </UCard>
                  </div>
                </div>
              </div>
            </SplitterPanel>

            <SplitterResizeHandle class="h-0.5 splitter-handle" />

            <!-- Gallery Panel -->
            <SplitterPanel :default-size="50" :min-size="20">
              <div class="flex flex-col h-full">
                <header class="p-3 border-b border-white/10">
                  <h2 class="text-sm font-medium">
                    Gallery <span v-if="galleryImages.length > 0" class="text-white/50">({{ galleryImages.length }})</span>
                  </h2>
                </header>
                <div class="flex-1 flex overflow-hidden">
                  <div v-if="galleryImages.length === 0" class="flex items-center justify-center w-full text-white/50">
                    <p>Gallery is empty.</p>
                  </div>
                  <div v-else class="flex w-full">
                    <!-- Gallery Grid -->
                    <div class="flex-1 overflow-auto p-4">
                      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        <div
                          v-for="image in galleryImages"
                          :key="image.id"
                          :class="[
                            'aspect-square bg-black/50 rounded cursor-pointer overflow-hidden border-2 transition-all hover:border-white/50',
                            selectedGalleryImage?.id === image.id ? 'border-white' : 'border-transparent',
                          ]"
                          @click="selectGalleryImage(image)"
                        >
                          <img
                            :src="image.url"
                            :alt="image.prompt"
                            class="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Selected Image Detail Panel -->
                    <div
                      v-if="selectedGalleryImage"
                      class="w-80 border-l border-white/10 p-4 overflow-auto bg-white/5"
                    >
                      <div class="space-y-4">
                        <!-- Image Preview -->
                        <div class="aspect-square bg-black/50 rounded overflow-hidden">
                          <img
                            :src="selectedGalleryImage.url"
                            :alt="selectedGalleryImage.prompt"
                            class="w-full h-full object-contain"
                          />
                        </div>

                        <!-- Image Info -->
                        <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                            <span class="text-white/50">Provider:</span>
                            <span>{{ selectedGalleryImage.provider }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-white/50">Model:</span>
                            <span>{{ selectedGalleryImage.model }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-white/50">Size:</span>
                            <span>{{ selectedGalleryImage.size }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-white/50">Seed:</span>
                            <span>{{ selectedGalleryImage.seed }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-white/50">Created:</span>
                            <span>{{ new Date(selectedGalleryImage.timestamp).toLocaleString() }}</span>
                          </div>
                        </div>

                        <!-- Prompts -->
                        <div class="space-y-2">
                          <div>
                            <p class="text-xs text-white/50 mb-1">Prompt:</p>
                            <p class="text-sm">{{ selectedGalleryImage.prompt }}</p>
                          </div>
                          <div v-if="selectedGalleryImage.negativePrompt">
                            <p class="text-xs text-white/50 mb-1">Negative:</p>
                            <p class="text-sm">{{ selectedGalleryImage.negativePrompt }}</p>
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex flex-col gap-2">
                          <UButton size="sm" variant="outline" class="w-full" @click="useImageParameters(selectedGalleryImage)">
                            Use These Parameters
                          </UButton>
                          <UButton
                            size="sm"
                            variant="destructive"
                            class="w-full"
                            @click="deleteGalleryImage(selectedGalleryImage.id)"
                          >
                            Delete
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SplitterPanel>
          </SplitterGroup>
        </SplitterPanel>
      </SplitterGroup>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.splitter-handle {
  transition: background-color 0.3s ease-in-out;
  background-color: var(--ui-border);
}

.splitter-handle[data-state="drag"],
.splitter-handle[data-state="hover"] {
  background-color: var(--ui-color-primary-500);
}
</style>
