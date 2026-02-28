<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
const { imageSettings } = storeToRefs(settingsStore);

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
  image?: string;
  image2?: string;
  image3?: string;
  [key: string]: any;
};

const providers = [
  { label: "OpenAI (DALL-E)", value: "openai" },
  { label: "Stability AI", value: "stability" },
  { label: "SiliconFlow", value: "siliconflow" },
];

const selectedProvider = ref(props.initialImage?.provider ?? "openai");
const selectedModel = ref(props.initialImage?.model ?? "dall-e-3");
const formValues = ref<Record<string, any>>({
  ...props.initialImage,
});
const form = ref<any>(null);
const isGenerating = ref(false);

const availableModels = computed(() =>
  IMAGE_MODELS_BY_PROVIDER[selectedProvider.value] ?? []
);

const formFields = computed<FormField[]>(() => {
  const key = `${selectedProvider.value}::${selectedModel.value}`;
  return IMAGE_GENERATION_CONFIG[key] || [];
});

watch(selectedProvider, (newProvider) => {
  const models = IMAGE_MODELS_BY_PROVIDER[newProvider] ?? [];
  if (models.length > 0) {
    selectedModel.value = models[0].value;
  }
});

watch([selectedProvider, selectedModel], () => {
  const fields = formFields.value;
  const newValues: Record<string, any> = {};
  fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      newValues[field.key] = field.defaultValue;
    }
  });
  formValues.value = newValues;
});

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(fieldKey: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const base64 = await fileToBase64(file);
    formValues.value[fieldKey] = base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    alert('Failed to process image');
  }
}

async function onSubmit() {
  if (!formValues.value.prompt?.trim()) return;

  isGenerating.value = true;

  try {
    const providerConfig = (imageSettings.value as any)[selectedProvider.value];
    if (!providerConfig?.apiKey) {
      throw new Error(`API key not configured for ${selectedProvider.value}`);
    }

    const provider = selectedProvider.value;
    const model = selectedModel.value;
    const seed = formValues.value.seed === -1 ? Math.floor(Math.random() * 999999) : formValues.value.seed;

    const params: Record<string, any> = {
      ...formValues.value,
      seed,
    };

    const request: ImageGenerationRequest = {
      provider,
      model,
      numImages: formValues.value.batchSize ?? 1,
      ...params,
    } as ImageGenerationRequest;

    const results = await generateImage(request, providerConfig.apiKey);

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
          provider,
          model,
          params: {
            ...params,
            seed: seed + i,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await writeImage(imageData);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `${imageId}.jpg`, { type: 'image/jpeg' });
        const fileId = await writeFile(file);

        const imageData: Image = {
          id: imageId,
          fileId,
          provider,
          model,
          params: {
            ...params,
            seed: seed + i,
          },
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
        <UForm ref="form" class="flex-1 overflow-auto space-y-4" @submit="onSubmit">
          <UFormField label="Provider">
            <USelectMenu class="w-full" v-model="selectedProvider" :items="providers" value-key="value" />
          </UFormField>

          <UFormField label="Model">
            <USelectMenu class="w-full" v-model="selectedModel" :items="availableModels" value-key="value" />
          </UFormField>

          <UFormField
            v-for="field in formFields"
            :key="field.key"
            :label="field.label"
            :required="field.required"
          >
            <USelectMenu
              v-if="field.type === 'select' && field.options"
              class="w-full"
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
              class="w-full"
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
            <div v-else-if="field.type === 'image'" class="space-y-2">
              <UFileUpload
                v-model="formValues[field.key]"
                accept="image/*"
                class="w-full min-h-32"
                @change="handleImageUpload(field.key, $event)"
              />
            </div>
          </UFormField>
        </UForm>
      </div>
    </template>
    <template #footer>
      <UButton
        size="lg"
        class="w-full"
        :disabled="!formValues.prompt?.trim() || isGenerating"
        :label="isGenerating ? 'Generating...' : 'Generate Images'"
        @click="form?.submit()"
      />
    </template>
  </USlideover>
</template>
