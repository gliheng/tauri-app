import { createRouter, createWebHashHistory } from "vue-router";
import { nanoid } from "nanoid";
import Chat from "./pages/Chat.vue";
import Library from "./pages/Library.vue";
import Agent from "./pages/Agent.vue";
import CreateAgent from "./pages/CreateAgent.vue";
import NotFound from "./pages/NotFound.vue";
import DefaultLayout from "./layouts/DefaultLayout.vue";

export const router = createRouter({
  routes: [
    {
      name: "home",
      path: "/",
      component: DefaultLayout,
      redirect() {
        const id = nanoid();
        sessionStorage.setItem("lastChatId", id);
        return { name: "chat", params: { id } };
      },
      children: [
        { name: "chat", path: "chat/:id", component: Chat },
        { name: "create-agent", path: "agent/create", component: CreateAgent },
        { name: "agent", path: "agent/:id", component: Agent },
        { name: "library", path: "library/:id", component: Library },
      ],
    },
    { name: "404", path: "/:pathMatch(.*)*", component: NotFound },
  ],
  history: createWebHashHistory(),
});
