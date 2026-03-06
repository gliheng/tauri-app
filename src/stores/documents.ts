import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { Document, getDocuments, deleteDocument as dbDeleteDocument } from "@/db";

export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<Document[]>([]);

  async function loadDocuments(type?: 'note' | 'chart') {
    documents.value = await getDocuments(type);
  }

  async function deleteDocument(id: string) {
    await dbDeleteDocument(id);
    documents.value = documents.value.filter(doc => doc.id !== id);
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
    deleteDocument,
  };
});
