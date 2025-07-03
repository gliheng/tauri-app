import { ref, watch } from "vue";
import { defineStore } from "pinia";

export function loadModelSettings() {
  const storedSettings = localStorage.getItem("modelSettings");
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }

  return {
    openrouter: {
      apiKey: "",
      enabled: true,
    },
    deepseek: {
      apiKey: "",
      enabled: true,
    },
    silliconflow: {
      apiKey: "",
      enabled: true,
    },
  };
}

export const useSettingsStore = defineStore("settings", () => {
  const modelSettings = ref(loadModelSettings());

  watch(modelSettings, (v) => {
    localStorage.setItem("modelSettings", JSON.stringify(v));
  }, {
    deep: true,
  });

  return {
    modelSettings,
  };
});
