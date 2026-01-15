import { ref } from "vue";
import { defineStore } from "pinia";
import { Note, getNotes } from "@/db-sqlite";

export const useNotesStore = defineStore("notes", () => {
  async function loadNotes() {
    notes.value = await getNotes();
  }

  const notes = ref<Note[]>([]);

  return {
    notes,
    loadNotes,
  };
});
