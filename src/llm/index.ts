import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { loadModelSettings } from "@/stores/settings";

export function getModel(model?: string) {
  model = model ?? "deepseek::deepseek-chat";
  const [provider, name] = model.split("::");
  const apiKey = loadModelSettings()[provider]?.apiKey;
  debugger;
  if (provider == "deepseek") {
    // sk-f721ca4afb6b4fb3a3937bb3e3b64e3d
    return createDeepSeek({
      apiKey,
    })(name);
  } else if (provider == "openrouter") {
    // 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
    return createOpenRouter({
      apiKey,
    })(name);
  } else if (provider == "silliconflow") {
    // sk-hytuswwjmgybiopdpwtmxexnsaxejglwvrykkjfidzqgohny
    return createOpenAICompatible({
      name: 'silliconflow',
      apiKey,
      baseURL: 'https://api.siliconflow.cn/v1',
    })(name);
  }

  throw new Error("Invalid model");
}
