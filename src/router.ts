import { createRouter, createWebHashHistory } from "vue-router";
import { nanoid } from "nanoid";
import Chat from "./pages/Chat.vue";
import Library from "./pages/Library.vue";
import Agent from "./pages/Agent.vue";

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
    { name: "agent", path: "/agent/:id", component: Agent },
    { name: "library", path: "/library/:id", component: Library },
  ],
  history: createWebHashHistory(),
});
