import { createApp } from "vue";
import { createPinia, Pinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import { init as initNative } from "./native";
import { router } from "./router";
import App from "./App.vue";
import { init as initDb } from "./db";
import { initSupabase } from "./lib/supabase/client";
import { useChatsStore } from "./stores/chats";
import { useAuthStore } from "./stores/auth";
import "./assets/style.css";

(async () => {
  const app = createApp(App);
  const pinia = createPinia();

  await initDb();
  await initSupabase();
  app.use(pinia);
  app.use(router);
  app.use(ui);
  app.mount("#app");

  initNative();
  initDataStores(pinia);
})();

function initDataStores(pinia: Pinia) {
  const chatsStore = useChatsStore(pinia);
  chatsStore.loadChats();

  // Initialize auth store
  const authStore = useAuthStore(pinia);
  authStore.initialize();
}
