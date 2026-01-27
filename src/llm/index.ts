import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { useSettingsStore } from "@/stores/settings";
import { AgentProgram } from "@/db";

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
  } else if (provider == "siliconflow") {
    return createOpenAICompatible({
      name: 'siliconflow',
      apiKey,
      baseURL: getProviderBaseUrl('siliconflow'),
    })(name);
  } else if (provider == "zai") {
    return createOpenAICompatible({
      name: 'zai',
      apiKey,
      baseURL: getProviderBaseUrl('zai'),
    })(name);
  } else if (provider == "minimax") {
    return createOpenAICompatible({
      name: 'minimax',
      apiKey,
      baseURL: getProviderBaseUrl('minimax'),
    })(name);
  }

  throw new Error("Invalid model");
}

export function getModelConfig(model?: string) {
  model = model ?? "deepseek::deepseek-chat";
  const [provider, name] = model.split("::");

  const settingsStore = useSettingsStore();
  const apiKey = settingsStore.modelSettings[provider]?.apiKey ?? '';

  return {
    provider,
    model: name,
    apiKey,
    baseUrl: getProviderBaseUrl(provider),
  };
};

export function getAgentConfig(type: AgentProgram) {
  const settingsStore = useSettingsStore();
  return settingsStore.agentSettings[type];
}

export function getProviderBaseUrl(provider: string) {
  if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
  if (provider === 'deepseek') return 'https://api.deepseek.com';
  if (provider === 'siliconflow') return 'https://api.siliconflow.cn/v1';
  if (provider === 'minimax') return 'https://api.minimaxi.com/v1';
  if (provider === 'zai') return 'https://open.bigmodel.cn/api/paas/v4';
  return '';
}