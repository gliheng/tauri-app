import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { defaultsDeep } from 'lodash-es';
import { CodeAgent } from "@/db-sqlite";

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

export interface CodeAgentConfig {
  useCustomModel?: boolean;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

const defaultCodeAgentSettings: Record<CodeAgent, CodeAgentConfig> = {
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

export function loadCodeAgentSettings() {
  const stored = localStorage.getItem("codeAgentSettings");
  const storedSettings = stored ? JSON.parse(stored) : {};
  return defaultsDeep({}, storedSettings, defaultCodeAgentSettings) as Record<CodeAgent, CodeAgentConfig>;
}

export function loadModelSettings() {
  const stored = localStorage.getItem("modelSettings");
  const storedSettings = stored ? JSON.parse(stored) : {};
  return defaultsDeep({}, storedSettings, defaultModelSettings) as Record<string, ChatModelConfig>;
}

export function loadChatSettings() {
  const stored = localStorage.getItem("chatSettings");
  const storedSettings = stored ? JSON.parse(stored) : {};
  return defaultsDeep({}, storedSettings, defaultChatSettings) as typeof defaultChatSettings;
}

export const useSettingsStore = defineStore("settings", () => {
  const modelSettings = ref(loadModelSettings());
  const codeAgentSettings = ref(loadCodeAgentSettings());
  const chatSettings = ref(loadChatSettings());
  
  watch(modelSettings, (v) => {
    localStorage.setItem("modelSettings", JSON.stringify(v));
  }, {
    deep: true,
  });
  
  watch(codeAgentSettings, (v) => {
    localStorage.setItem("codeAgentSettings", JSON.stringify(v));
  }, {
    deep: true,
  });
  
  watch(chatSettings, (v) => {
    localStorage.setItem("chatSettings", JSON.stringify(v));
  }, {
    deep: true,
  });

  return {
    modelSettings,
    codeAgentSettings,
    chatSettings,
  };
});
