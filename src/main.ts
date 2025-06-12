import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHashHistory } from "vue-router";
import ui from "@nuxt/ui/vue-plugin";
import { isTauri } from "@tauri-apps/api/core";
import { setup } from "./native";
import "./assets/style.css";
import { router } from "./router";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ui);
app.mount("#app");

if (isTauri()) {
  setup();
}
