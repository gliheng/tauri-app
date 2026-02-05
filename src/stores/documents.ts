import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { Document, getDocuments } from "@/db";

export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<Document[]>([]);

  async function loadDocuments(type?: 'note' | 'chart') {
    documents.value = await getDocuments(type);
  }

  const notes = computed(() =>
    documents.value.filter(doc => doc.type === 'note')
  );

  const charts = computed(() =>
    documents.value.filter(doc => doc.type === 'chart')
  );

  return {
    documents,
    notes,
    charts,
    loadDocuments,
  };
});
