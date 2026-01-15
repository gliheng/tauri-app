import { ref } from "vue";
import { defineStore } from "pinia";
import { Agent, getAgents } from "@/db-sqlite";

export const useSidebarStore = defineStore("sidebar", () => {
  async function load() {
    loadAgents();
  }
  async function loadAgents() {
    agents.value = await getAgents();
  }

  const agents = ref<Agent[]>([]);
  return {
    load,
    loadAgents,
    agents,
    setSidebarAgent(id: string, name: string) {
      const agent = agents.value.find((agent) => agent.id === id);
      if (agent) {
        agent.name = name;
      }
    },
  };
});
