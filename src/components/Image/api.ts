export interface ImageGenerationRequest {
  provider: string;
  model: string;
  prompt: string;
  [key: string]: any;
}

export interface GeneratedImage {
  url: string;
}

async function generateOpenAIImage(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<GeneratedImage[]> {
  const body: any = {
    model: request.model,
    prompt: request.prompt,
    n: request.n || 1,
    size: request.size || "1024x1024",
  };

  if (request.model === "dall-e-3") {
    body.quality = "standard";
  }

  if (request.seed !== undefined && request.seed !== -1) {
    body.seed = request.seed;
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: any) => ({ url: item.url }));
}

async function generateStabilityImage(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<GeneratedImage[]> {
  const formData = new FormData();
  
  formData.append("prompt", request.prompt);
  formData.append("mode", "text-to-image");
  formData.append("model", request.model);
  formData.append("output_format", "png");
  
  if (request.negativePrompt) {
    formData.append("negative_prompt", request.negativePrompt);
  }
  
  if (request.aspectRatio) {
    formData.append("aspect_ratio", request.aspectRatio);
  }
  
  if (request.seed !== undefined && request.seed !== -1) {
    formData.append("seed", request.seed.toString());
  }

  const response = await fetch(
    `https://api.stability.ai/v2beta/stable-image/generate/${request.model}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stability AI API error: ${error}`);
  }

  const imageBlob = await response.blob();
  const blob = new Blob([imageBlob], { type: 'image/png' });
  return [{ url: URL.createObjectURL(blob) }];
}

async function generateSiliconflowImage(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<GeneratedImage[]> {
  const modelMap: Record<string, string> = {
    "kolors": "Kwai-Kolors/Kolors",
    "qwen-image": "Qwen/Qwen-Image",
    "qwen-image-edit": "Qwen/Qwen-Image-Edit",
    "qwen-image-edit-2509": "Qwen/Qwen-Image-Edit-2509",
  };

  const siliconModel = modelMap[request.model] || request.model;

  const body: any = {
    model: siliconModel,
    prompt: request.prompt,
    image_size: request.size || "1024x1024",
    seed: request.seed && request.seed !== -1 ? request.seed : Math.floor(Math.random() * 9999999999),
    num_inference_steps: request.numInferenceSteps || 50,
  };

  if (request.model === "kolors") {
    body.batch_size = request.batchSize || 1;
    body.guidance_scale = request.guidanceScale || 7.5;
    body.num_inference_steps = request.numInferenceSteps || 20;
  }

  if (request.model === "qwen-image" || request.model === "qwen-image-edit" || request.model === "qwen-image-edit-2509") {
    body.cfg = request.cfgScale || 4;
  }

  if (request.model === "qwen-image-edit-2509") {
    if (request.image) {
      body.image = request.image;
    }
    if (request.image2) {
      body.image2 = request.image2;
    }
    if (request.image3) {
      body.image3 = request.image3;
    }
  }

  if (request.model === "qwen-image-edit" && request.image) {
    body.image = request.image;
  }

  if (request.negativePrompt) {
    body.negative_prompt = request.negativePrompt;
  }

  const response = await fetch("https://api.siliconflow.cn/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SiliconFlow API error: ${error}`);
  }

  const data = await response.json();
  return data.images.map((img: any) => ({ url: img.url }));
}

export async function generateImage(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<GeneratedImage[]> {
  switch (request.provider) {
    case "openai":
      return generateOpenAIImage(request, apiKey);
    case "stability":
      return generateStabilityImage(request, apiKey);
    case "siliconflow":
      return generateSiliconflowImage(request, apiKey);
    default:
      throw new Error(`Unsupported provider: ${request.provider}`);
  }
}
