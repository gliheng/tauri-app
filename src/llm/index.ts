import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getModel(model?: string) {
  model = model ?? "deepseek::deepseek-chat";
  const [provider, name] = model.split("::");
  if (provider == "deepseek") {
    return createDeepSeek({
      apiKey: "sk-f721ca4afb6b4fb3a3937bb3e3b64e3d",
    })(name);
  } else if (provider == "openrouter") {
    return createOpenRouter({
      apiKey:
        "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",
    })(name);
  } else if (provider == "silliconflow") {
    return createOpenAICompatible({
      name: 'silliconflow',
      apiKey: 'sk-hytuswwjmgybiopdpwtmxexnsaxejglwvrykkjfidzqgohny',
      baseURL: 'https://api.siliconflow.cn/v1',
    })(name);
  }

  throw new Error("Invalid model");
}
