import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { loadModelSettings } from "@/stores/settings";

export function getModel(model?: string) {
  model = model ?? "deepseek::deepseek-chat";
  const { provider, model: name, apiKey } = getModelConfig(model);
  if (provider == "deepseek") {
    return createDeepSeek({
      apiKey,
    })(name);
  } else if (provider == "openrouter") {
    return createOpenRouter({
      apiKey,
    })(name);
  } else if (provider == "silliconflow") {
    return createOpenAICompatible({
      name: 'silliconflow',
      apiKey,
      baseURL: 'https://api.siliconflow.cn/v1',
    })(name);
  }

  throw new Error("Invalid model");
}

export function getModelConfig(model?: string) {
  model = model ?? "deepseek::deepseek-chat";
  const [provider, name] = model.split("::");
  return {
    provider,
    model: name,
    apiKey: loadModelSettings()[provider].apiKey,
    baseUrl: getProviderBaseUrl(provider),
  };
};

export function getProviderBaseUrl(provider: string) {
  if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
  if (provider === 'deepseek') return 'https://api.deepseek.com';
  if (provider === 'silliconflow') return 'https://api.siliconflow.cn/v1';
  if (provider === 'minimax') return 'https://api.minimaxi.com/v1';
  if (provider === 'zai') return 'https://open.bigmodel.cn/api/paas/v4';
  return '';
}