import { createApp } from "vue";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import { isTauri } from "@tauri-apps/api/core";
import { init as initNative } from "./native";
import "./assets/style.css";
import { router } from "./router";
import App from "./App.vue";
import { init as initDb } from "./db";

(async () => {
  const app = createApp(App);
  const pinia = createPinia();
  
  await initDb();
  app.use(pinia);
  app.use(router);
  app.use(ui);
  app.mount("#app");
  
  if (isTauri()) {
    initNative();
  }
})();
