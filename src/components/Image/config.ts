export type FormFieldType = "select" | "slider" | "input" | "textarea";

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
}

export interface ProviderModelConfig {
  [key: string]: FormField[];
}

export const IMAGE_GENERATION_CONFIG: ProviderModelConfig = {
  "openai::dall-e-3": [
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
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
    },
  ],
  "openai::dall-e-2": [
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
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
    },
  ],
  "stability::sdxl-1.0": [
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "512×512", value: "512x512" },
        { label: "768×768", value: "768x768" },
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
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
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
      min: 1,
      max: 20,
      step: 0.5,
      defaultValue: 7,
    },
  ],
  "stability::sd-3.0": [
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "512×512", value: "512x512" },
        { label: "768×768", value: "768x768" },
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
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
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
      min: 1,
      max: 20,
      step: 0.5,
      defaultValue: 7,
    },
  ],
  "replicate::sdxl": [
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "512×512", value: "512x512" },
        { label: "768×768", value: "768x768" },
        { label: "512×768", value: "512x768" },
        { label: "768×512", value: "768x512" },
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
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
    },
    {
      key: "negativePrompt",
      label: "Negative Prompt",
      type: "textarea",
      placeholder: "What to avoid in image...",
      rows: 2,
    },
    {
      key: "guidanceScale",
      label: "Guidance Scale",
      type: "slider",
      min: 1,
      max: 20,
      step: 0.5,
      defaultValue: 7.5,
    },
    {
      key: "numInferenceSteps",
      label: "Inference Steps",
      type: "slider",
      min: 10,
      max: 100,
      step: 1,
      defaultValue: 30,
    },
  ],
  "replicate::flux-1": [
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "512×512", value: "512x512" },
        { label: "768×768", value: "768x768" },
        { label: "512×768", value: "512x768" },
        { label: "768×512", value: "768x512" },
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
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
    },
    {
      key: "numInferenceSteps",
      label: "Inference Steps",
      type: "slider",
      min: 4,
      max: 50,
      step: 1,
      defaultValue: 28,
    },
  ],
  "midjourney::v6": [
    {
      key: "aspectRatio",
      label: "Aspect Ratio",
      type: "select",
      options: [
        { label: "1:1 (Square)", value: "1:1" },
        { label: "16:9 (Landscape)", value: "16:9" },
        { label: "9:16 (Portrait)", value: "9:16" },
        { label: "4:3", value: "4:3" },
        { label: "3:2", value: "3:2" },
      ],
      defaultValue: "1:1",
    },
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
    },
    {
      key: "quality",
      label: "Quality",
      type: "select",
      options: [
        { label: "Standard", value: "1" },
        { label: "High", value: "2" },
      ],
      defaultValue: "1",
    },
  ],
  "midjourney::v5.2": [
    {
      key: "aspectRatio",
      label: "Aspect Ratio",
      type: "select",
      options: [
        { label: "1:1 (Square)", value: "1:1" },
        { label: "16:9 (Landscape)", value: "16:9" },
        { label: "9:16 (Portrait)", value: "9:16" },
        { label: "4:3", value: "4:3" },
        { label: "3:2", value: "3:2" },
      ],
      defaultValue: "1:1",
    },
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Describe image you want to generate...",
      rows: 4,
    },
    {
      key: "stylize",
      label: "Stylize",
      type: "slider",
      min: 0,
      max: 1000,
      step: 100,
      defaultValue: 250,
    },
  ],
};
