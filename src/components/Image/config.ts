export type FormFieldType = "select" | "slider" | "input" | "textarea" | "image";

export interface FormFieldOption {
  label: string;
  value: string | number;
}

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  options?: FormFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  rows?: number;
  defaultValue?: any;
  required?: boolean;
}

export interface ProviderModelConfig {
  [key: string]: FormField[];
}

export const IMAGE_GENERATION_CONFIG: ProviderModelConfig = {
  "openai::dall-e-3": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "n",
      label: "Number of Images",
      type: "slider",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 1,
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "1792×1024 (Wide)", value: "1792x1024" },
        { label: "1024×1792 (Tall)", value: "1024x1792" },
      ],
      defaultValue: "1024x1024",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
  ],
  "openai::dall-e-2": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "n",
      label: "Number of Images",
      type: "slider",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 1,
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "512×512", value: "512x512" },
        { label: "256×256", value: "256x256" },
      ],
      defaultValue: "1024x1024",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
  ],
  "stability::core": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "aspectRatio",
      label: "Aspect Ratio",
      type: "select",
      options: [
        { label: "1:1 (Square)", value: "1:1" },
        { label: "16:9 (Wide)", value: "16:9" },
        { label: "9:16 (Tall)", value: "9:16" },
        { label: "21:9 (Ultra Wide)", value: "21:9" },
        { label: "9:21 (Ultra Tall)", value: "9:21" },
        { label: "4:5", value: "4:5" },
        { label: "5:4", value: "5:4" },
        { label: "3:2", value: "3:2" },
        { label: "2:3", value: "2:3" },
      ],
      defaultValue: "1:1",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
  ],
  "stability::sd3": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "aspectRatio",
      label: "Aspect Ratio",
      type: "select",
      options: [
        { label: "1:1 (Square)", value: "1:1" },
        { label: "16:9 (Wide)", value: "16:9" },
        { label: "9:16 (Tall)", value: "9:16" },
        { label: "21:9 (Ultra Wide)", value: "21:9" },
        { label: "9:21 (Ultra Tall)", value: "9:21" },
        { label: "4:5", value: "4:5" },
        { label: "5:4", value: "5:4" },
        { label: "3:2", value: "3:2" },
        { label: "2:3", value: "2:3" },
      ],
      defaultValue: "1:1",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
  ],
  "stability::ultra": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "aspectRatio",
      label: "Aspect Ratio",
      type: "select",
      options: [
        { label: "1:1 (Square)", value: "1:1" },
        { label: "16:9 (Wide)", value: "16:9" },
        { label: "9:16 (Tall)", value: "9:16" },
        { label: "21:9 (Ultra Wide)", value: "21:9" },
        { label: "9:21 (Ultra Tall)", value: "9:21" },
        { label: "4:5", value: "4:5" },
        { label: "5:4", value: "5:4" },
        { label: "3:2", value: "3:2" },
        { label: "2:3", value: "2:3" },
      ],
      defaultValue: "1:1",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
  ],

  "siliconflow::kolors": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024 (1:1)", value: "1024x1024" },
        { label: "960×1280 (3:4)", value: "960x1280" },
        { label: "768×1024 (3:4)", value: "768x1024" },
        { label: "720×1440 (1:2)", value: "720x1440" },
        { label: "720×1280 (9:16)", value: "720x1280" },
      ],
      defaultValue: "1024x1024",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
    {
      key: "batchSize",
      label: "Number of Images",
      type: "slider",
      min: 1,
      max: 4,
      step: 1,
      defaultValue: 1,
    },
    {
      key: "numInferenceSteps",
      label: "Inference Steps",
      type: "slider",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 20,
    },
    {
      key: "guidanceScale",
      label: "Guidance Scale",
      type: "slider",
      min: 0,
      max: 20,
      step: 0.5,
      defaultValue: 7.5,
    },
  ],
  "siliconflow::qwen-image": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1328×1328 (1:1)", value: "1328x1328" },
        { label: "1664×928 (16:9)", value: "1664x928" },
        { label: "928×1664 (9:16)", value: "928x1664" },
        { label: "1472×1140 (4:3)", value: "1472x1140" },
        { label: "1140×1472 (3:4)", value: "1140x1472" },
        { label: "1584×1056 (3:2)", value: "1584x1056" },
        { label: "1056×1584 (2:3)", value: "1056x1584" },
      ],
      defaultValue: "1024x1024",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
    {
      key: "cfgScale",
      label: "CFG Scale",
      type: "slider",
      min: 0.1,
      max: 20,
      step: 0.1,
      defaultValue: 4,
    },
    {
      key: "numInferenceSteps",
      label: "Inference Steps",
      type: "slider",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 50,
    },
  ],
  "siliconflow::qwen-image-edit": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "image",
      label: "Image",
      type: "image",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
    {
      key: "cfgScale",
      label: "CFG Scale",
      type: "slider",
      min: 0.1,
      max: 20,
      step: 0.1,
      defaultValue: 4,
    },
    {
      key: "numInferenceSteps",
      label: "Inference Steps",
      type: "slider",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 50,
    },
  ],
  "siliconflow::qwen-image-edit-2509": [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
      required: true,
    },
    {
      key: "image",
      label: "Image",
      type: "image",
    },
    {
      key: "image2",
      label: "Image 2 (Optional)",
      type: "image",
    },
    {
      key: "image3",
      label: "Image 3 (Optional)",
      type: "image",
    },
    {
      key: "seed",
      label: "Seed (-1 for random)",
      type: "input",
      placeholder: "-1",
      defaultValue: -1,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
    {
      key: "cfgScale",
      label: "CFG Scale",
      type: "slider",
      min: 0.1,
      max: 20,
      step: 0.1,
      defaultValue: 4,
    },
    {
      key: "numInferenceSteps",
      label: "Inference Steps",
      type: "slider",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 50,
    },
  ],
};
