import { ref } from "vue";
import { defineStore } from "pinia";
import { Agent, Library, getAgents } from "@/db";

export const useSidebarStore = defineStore("sidebar", () => {
  async function load() {
    agents.value = await getAgents();
  }
  const agents = ref<Agent[]>([]);
  const libraries = ref<Library[]>([]);
  return {
    load,
    agents,
    libraries,
    setSidebarAgent(id: string, name: string) {
      const agent = agents.value.find((agent) => agent.id === id);
      if (agent) {
        agent.name = name;
      }
    },
  };
});
