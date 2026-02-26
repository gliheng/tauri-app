<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from "vue";
import { useImagesStore } from "@/stores/images";
import { IMAGE_MODELS_BY_PROVIDER } from "@/constants";
import { IMAGE_GENERATION_CONFIG, type FormField } from "./config";
import { writeFile, writeImage, type Image, type ImageWithFile } from "@/db";
import { nanoid } from "nanoid";

const emit = defineEmits<{
  close: [];
}>();

const props = defineProps<{
  initialImage?: ImageWithFile | null;
}>();

const imagesStore = useImagesStore();

type ImageGenerationRequest = {
  provider: string;
  model: string;
  [key: string]: any;
};

type GeneratedImage = {
  url: string;
};

const providers = [
  { label: "OpenAI (DALL-E)", value: "openai" },
  { label: "Stability AI", value: "stability" },
  { label: "Replicate", value: "replicate" },
  { label: "Midjourney", value: "midjourney" },
];

const selectedProvider = ref(props.initialImage?.provider ?? "openai");
const selectedModel = ref(props.initialImage?.model ?? "dall-e-3");
const numImages = ref(1);
const formValues = reactive<Record<string, any>>({});
const isGenerating = ref(false);

const availableModels = computed(() =>
  IMAGE_MODELS_BY_PROVIDER[selectedProvider.value] || IMAGE_MODELS_BY_PROVIDER.openai
);

const formFields = computed<FormField[]>(() => {
  const key = `${selectedProvider.value}::${selectedModel.value}`;
  return IMAGE_GENERATION_CONFIG[key] || [];
});

watch(selectedProvider, (newProvider) => {
  const models = IMAGE_MODELS_BY_PROVIDER[newProvider] || IMAGE_MODELS_BY_PROVIDER.openai;
  if (models.length > 0) {
    selectedModel.value = models[0].value;
  }
});

watch([selectedProvider, selectedModel], () => {
  const fields = formFields.value;
  nextTick(() => {
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        formValues.value[field.key] = field.defaultValue;
      }
    });
  });
}, { immediate: true });

onMounted(() => {
  if (props.initialImage) {
    nextTick(() => {
      formValues.prompt = props.initialImage!.prompt;
      formValues.negativePrompt = props.initialImage!.negativePrompt || "";
      formValues.size = props.initialImage!.size;
      formValues.seed = props.initialImage!.seed;
      numImages.value = 1;
    });
  }
});

async function generateMockImage(
  request: ImageGenerationRequest
): Promise<GeneratedImage[]> {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

  const size = request.size || "1024x1024";
  const [width, height] = size.split("x").map(Number);
  const numImages = request.numImages || 1;
  const results: GeneratedImage[] = [];

  for (let i = 0; i < numImages; i++) {
    const imageSeed = request.seed === -1 ? Math.floor(Math.random() * 999999) : request.seed + i;
    const url = `https://picsum.photos/seed/${imageSeed}/${width}/${height}`;
    results.push({ url });
  }

  return results;
}

async function generateImages() {
  if (!formValues.prompt?.trim()) return;

  isGenerating.value = true;

  try {
    const request: ImageGenerationRequest = {
      provider: selectedProvider.value,
      model: selectedModel.value,
      numImages: numImages.value,
      ...formValues,
    };

    const mockResults = await generateMockImage(request);
    const actualSeed = formValues.seed === -1 ? Math.floor(Math.random() * 999999) : formValues.seed;

    for (let i = 0; i < mockResults.length; i++) {
      const imageId = nanoid();
      const url = mockResults[i].url;

      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `${imageId}.jpg`, { type: 'image/jpeg' });

      const fileId = await writeFile(file);

      const size = request.size || "1024x1024";

      const imageData: Image = {
        id: imageId,
        fileId,
        provider: selectedProvider.value,
        model: selectedModel.value,
        size,
        prompt: formValues.prompt,
        negativePrompt: formValues.negativePrompt,
        seed: actualSeed + i,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await writeImage(imageData);
    }

    await imagesStore.loadImages();
    emit('close');
  } catch (error) {
    console.error("Error generating images:", error);
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <USlideover title="Generate Image" description="Create images using AI models" side="right">
    <template #body>
      <div class="flex flex-col h-full">
        <UForm class="flex-1 overflow-auto space-y-4">
          <UFormField label="Provider">
            <USelectMenu v-model="selectedProvider" :items="providers" value-key="value" />
          </UFormField>

          <UFormField label="Model">
            <USelectMenu v-model="selectedModel" :items="availableModels" value-key="value" />
          </UFormField>

          <UFormField label="Number of Images">
            <div class="flex items-center gap-4">
              <USlider v-model="numImages" :min="1" :max="4" :step="1" class="flex-1" />
              <span class="w-8 text-center text-sm">{{ numImages }}</span>
            </div>
          </UFormField>

          <UFormField
            v-for="field in formFields"
            :key="field.key"
            :label="field.label"
          >
            <USelectMenu
              v-if="field.type === 'select' && field.options"
              v-model="formValues[field.key]"
              :items="field.options"
              value-key="value"
            />
            <div v-else-if="field.type === 'slider'" class="flex items-center gap-4">
              <USlider
                v-model="formValues[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                class="flex-1"
              />
              <span class="w-12 text-center text-sm">{{ formValues[field.key] }}</span>
            </div>
            <UInput
              v-else-if="field.type === 'input'"
              v-model.number="formValues[field.key]"
              type="number"
              :placeholder="field.placeholder"
            />
            <UTextarea
              v-else-if="field.type === 'textarea'"
              v-model="formValues[field.key]"
              :placeholder="field.placeholder"
              :rows="field.rows"
              class="resize-none"
            />
          </UFormField>
        </UForm>
      </div>
    </template>
    <template #footer>
      <UButton
        size="lg"
        class="w-full"
        :disabled="!formValues.prompt?.trim() || isGenerating"
        @click="generateImages"
      >
        <template v-if="isGenerating">
          <span class="animate-pulse">Generating...</span>
        </template>
        <template v-else>Generate Images</template>
      </UButton>
    </template>
  </USlideover>
</template>
