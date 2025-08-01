import { ref } from "vue";
import { defineStore } from "pinia";
import { Agent, getAgents, getNotes, Note } from "@/db";

export const useSidebarStore = defineStore("sidebar", () => {
  async function load() {
    agents.value = await getAgents();
    notes.value = await getNotes();
  }
  const agents = ref<Agent[]>([]);
  const notes = ref<Note[]>([]);
  return {
    load,
    agents,
    notes,
    setSidebarAgent(id: string, name: string) {
      const agent = agents.value.find((agent) => agent.id === id);
      if (agent) {
        agent.name = name;
      }
    },
  };
});
