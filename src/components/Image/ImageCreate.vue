<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useImagesStore } from "@/stores/images";
import { useSettingsStore } from "@/stores/settings";
import { IMAGE_MODELS_BY_PROVIDER } from "@/constants";
import { IMAGE_GENERATION_CONFIG, type FormField } from "./config";
import { writeFile, writeImage, type Image, type ImageWithFile } from "@/db";
import { nanoid } from "nanoid";
import { generateImage } from "@/lib/imageGeneration";

const emit = defineEmits<{
  close: [];
}>();

const props = defineProps<{
  initialImage?: ImageWithFile | null;
}>();

const imagesStore = useImagesStore();
const settingsStore = useSettingsStore();
const { imageModelSettings } = storeToRefs(settingsStore);

type ImageGenerationRequest = {
  provider: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  size?: string;
  numImages?: number;
  seed?: number;
  cfgScale?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  batchSize?: number;
  [key: string]: any;
};

const providers = [
  { label: "OpenAI (DALL-E)", value: "openai" },
  { label: "Stability AI", value: "stability" },
  { label: "SiliconFlow", value: "siliconflow" },
];

const selectedProvider = ref(props.initialImage?.provider ?? "openai");
const selectedModel = ref(props.initialImage?.model ?? "dall-e-3");
const numImages = ref(1);
const formValues = ref<Record<string, any>>({});
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
});

onMounted(() => {
  if (props.initialImage) {
    formValues.value.prompt = props.initialImage!.prompt;
    formValues.value.negativePrompt = props.initialImage!.negativePrompt || "";
    formValues.value.size = props.initialImage!.size;
    formValues.value.seed = props.initialImage!.seed;
    numImages.value = 1;
  }
});

async function generateImages() {
  if (!formValues.value.prompt?.trim()) return;

  isGenerating.value = true;

  try {
    const providerConfig = (imageModelSettings.value as any)[selectedProvider.value];
    if (!providerConfig?.apiKey) {
      throw new Error(`API key not configured for ${selectedProvider.value}`);
    }

    const request: ImageGenerationRequest = {
      provider: selectedProvider.value,
      model: selectedModel.value,
      numImages: numImages.value,
      prompt: formValues.value.prompt || "",
      ...formValues.value,
    } as ImageGenerationRequest;

    const results = await generateImage(request, providerConfig.apiKey);
    const actualSeed = formValues.value.seed === -1
      ? Math.floor(Math.random() * 999999)
      : formValues.value.seed;

    for (let i = 0; i < results.length; i++) {
      const imageId = nanoid();
      const url = results[i].url;

      if (url.startsWith('blob:')) {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `${imageId}.png`, { type: 'image/png' });
        const fileId = await writeFile(file);

        const imageData: Image = {
          id: imageId,
          fileId,
          provider: selectedProvider.value,
          model: selectedModel.value,
          size: request.size || "1024x1024",
          prompt: formValues.value.prompt,
          negativePrompt: formValues.value.negativePrompt,
          seed: actualSeed + i,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await writeImage(imageData);
      } else {
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
          prompt: formValues.value.prompt,
          negativePrompt: formValues.value.negativePrompt,
          seed: actualSeed + i,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await writeImage(imageData);
      }
    }

    await imagesStore.loadImages();
    emit('close');
  } catch (error) {
    console.error("Error generating images:", error);
    alert(error instanceof Error ? error.message : "Failed to generate images");
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
              class="w-full"
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
