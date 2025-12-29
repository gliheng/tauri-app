import { createRouter, createWebHashHistory } from "vue-router";
import { nanoid } from "nanoid";
import Chat from "./pages/Chat.vue";
import Agent from "./pages/Agent.vue";
import Note from "./pages/Note.vue";
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
        { name: "agent", path: "agent/:id", component: Agent },
        { name: "note", path: "note/:id", component: Note },
      ],
    },
    { name: "editor", path: "/editor", component: () => import("./pages/Editor.vue") },
    { name: "404", path: "/:pathMatch(.*)*", component: NotFound },
  ],
  history: createWebHashHistory(),
});
