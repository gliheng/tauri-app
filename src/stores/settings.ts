import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { defaultsDeep } from 'lodash-es';
import * as settingsDb from "@/db/settings";

export interface ChatModelConfig {
  apiKey: string;
  models: string[];
}

const defaultModelSettings: Record<string, ChatModelConfig> = {
  deepseek: {
    apiKey: "",
    models: [],
  },
  minimax: {
    apiKey: "",
    models: [],
  },
  zai: {
    apiKey: "",
    models: [],
  },
  openrouter: {
    apiKey: "",
    models: [],
  },
  siliconflow: {
    apiKey: "",
    models: [],
  },
};

export interface AgentConfig {
  useCustomModel?: boolean;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

const defaultAgentSettings: Record<string, AgentConfig> = {
  codex: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  gemini: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  claude: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  qwen: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  opencode: {
    useCustomModel: false,
    model: "",
  },
};

const defaultChatSettings = {
  chatModel: 'deepseek::deepseek-chat',
};

const defaultWebSearchSettings = {
  apiKey: '',
};

export async function loadAgentSettings() {
  const dbSettings = await settingsDb.getAllAgentSettings();
  return defaultsDeep({}, dbSettings, defaultAgentSettings) as Record<string, AgentConfig>;
}

export async function loadModelSettings() {
  const dbSettings = await settingsDb.getAllModelSettings();
  return defaultsDeep({}, dbSettings, defaultModelSettings) as Record<string, ChatModelConfig>;
}

export async function loadChatSettings() {
  const dbSettings = await settingsDb.getChatSettings();
  return defaultsDeep({}, dbSettings, defaultChatSettings) as typeof defaultChatSettings;
}

export async function loadWebSearchSettings() {
  const dbSettings = await settingsDb.getWebSearchSettings();
  return defaultsDeep({}, dbSettings, defaultWebSearchSettings) as typeof defaultWebSearchSettings;
}

export const useSettingsStore = defineStore("settings", () => {
  const modelSettings = ref<Record<string, ChatModelConfig>>({});
  const agentSettings = ref<Record<string, AgentConfig>>({});
  const chatSettings = ref<typeof defaultChatSettings>({} as typeof defaultChatSettings);
  const webSearchSettings = ref<typeof defaultWebSearchSettings>({} as typeof defaultWebSearchSettings);

  async function initializeStore() {
    modelSettings.value = await loadModelSettings();
    agentSettings.value = await loadAgentSettings();
    chatSettings.value = await loadChatSettings();
    webSearchSettings.value = await loadWebSearchSettings();
  }

  initializeStore();

  watch(modelSettings, async (v) => {
    await settingsDb.writeAllModelSettings(v);
  }, {
    deep: true,
  });

  watch(agentSettings, async (v) => {
    await settingsDb.writeAllAgentSettings(v);
  }, {
    deep: true,
  });

  watch(chatSettings, async (v) => {
    await settingsDb.writeChatSettings(v);
  }, {
    deep: true,
  });

  watch(webSearchSettings, async (v) => {
    await settingsDb.writeWebSearchSettings(v);
  }, {
    deep: true,
  });

  return {
    modelSettings,
    agentSettings,
    chatSettings,
    webSearchSettings,
  };
});
