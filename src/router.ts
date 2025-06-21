import { createRouter, createWebHashHistory } from "vue-router";
import Chat from "./pages/Chat.vue";
import { nanoid } from "nanoid";
import Library from "./pages/Library.vue";

export const router = createRouter({
  routes: [
    {
      name: "home",
      path: "/",
      redirect() {
        const id = nanoid();
        sessionStorage.setItem("lastChatId", id);
        return { name: "chat", params: { id } };
      },
    },
    { name: "chat", path: "/chat/:id", component: Chat },
    { name: "library", path: "/library/:id", component: Library },
  ],
  history: createWebHashHistory(),
});
