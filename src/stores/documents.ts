import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { Document, getDocuments } from "@/db-sqlite";

export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<Document[]>([]);

  async function loadDocuments(type?: 'note' | 'chart') {
    documents.value = await getDocuments(type);
  }

  const notes = computed(() =>
    documents.value.filter(doc => doc.type === 'note').map(doc => ({
      id: doc.id,
      name: doc.name,
      icon: doc.icon,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))
  );

  const charts = computed(() =>
    documents.value.filter(doc => doc.type === 'chart').map(doc => ({
      id: doc.id,
      name: doc.name,
      icon: doc.icon,
      data: doc.data!,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))
  );

  return {
    documents,
    notes,
    charts,
    loadDocuments,
  };
});
