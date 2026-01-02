import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { defaultsDeep } from 'lodash-es';

const defaultSettings = {
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
  silliconflow: {
    apiKey: "",
    models: [],
  },
};

const defaultChatSettings = {
  chatModel: 'deepseek::deepseek-chat',
};

export function loadModelSettings() {
  const stored = localStorage.getItem("modelSettings");
  const storedSettings = stored ? JSON.parse(stored) : {};
  return defaultsDeep({}, storedSettings, defaultSettings);
}

export function loadChatSettings() {
  const stored = localStorage.getItem("chatSettings");
  const storedSettings = stored ? JSON.parse(stored) : {};
  return defaultsDeep({}, storedSettings, defaultChatSettings);
}

export const useSettingsStore = defineStore("settings", () => {
  const modelSettings = ref(loadModelSettings());
  const chatSettings = ref(loadChatSettings());
  
  watch(modelSettings, (v) => {
    localStorage.setItem("modelSettings", JSON.stringify(v));
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
    chatSettings,
  };
});
