import { ref } from "vue";
import { defineStore } from "pinia";
import { Agent, Document, getAgents, getDocuments } from "@/db-sqlite";

export const useSidebarStore = defineStore("sidebar", () => {
  async function load() {
    loadAgents();
    loadDocuments();
  }
  async function loadAgents() {
    agents.value = await getAgents();
  }
  async function loadDocuments() {
    documents.value = await getDocuments();
  }

  const agents = ref<Agent[]>([]);
  const documents = ref<Document[]>([]);
  return {
    load,
    loadAgents,
    loadDocuments,
    agents,
    documents,
    setSidebarAgent(id: string, name: string) {
      const agent = agents.value.find((agent) => agent.id === id);
      if (agent) {
        agent.name = name;
      }
    },
  };
});
