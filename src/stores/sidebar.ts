import { ref } from "vue";
import { defineStore } from "pinia";
import { Agent, getAgents, getNotes, Note, Chart, getCharts } from "@/db-sqlite";

export const useSidebarStore = defineStore("sidebar", () => {
  async function load() {
    loadAgents();
    loadNotes();
    loadCharts();
  }
  async function loadAgents() {
    agents.value = await getAgents();
  }
  async function loadNotes() {
    notes.value = await getNotes();
  }
  async function loadCharts() {
    charts.value = await getCharts();
  }

  const agents = ref<Agent[]>([]);
  const notes = ref<Note[]>([]);
  const charts = ref<Chart[]>([]);
  return {
    load,
    loadAgents,
    loadNotes,
    loadCharts,
    agents,
    notes,
    charts,
    setSidebarAgent(id: string, name: string) {
      const agent = agents.value.find((agent) => agent.id === id);
      if (agent) {
        agent.name = name;
      }
    },
  };
});
