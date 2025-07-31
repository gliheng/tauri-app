import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  Note,
  writeNote,
  updateNote,
  getAllNotes,
  getNote
} from "@/db";

export const useNoteStore = defineStore('note', () => {
  // State
  const notes = ref<Note[]>([]);
  const currentNote = ref<Note | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  const loadAllNotes = async () => {
    try {
      loading.value = true;
      error.value = null;
      notes.value = await getAllNotes();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load notes';
      console.error('Error loading notes:', err);
    } finally {
      loading.value = false;
    }
  };

  const loadNote = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;
      const note = await getNote(id);
      currentNote.value = note || null;
      return note;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load note';
      console.error('Error loading note:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      loading.value = true;
      error.value = null;

      const now = new Date();
      const newNote: Note = {
        id: crypto.randomUUID(),
        ...noteData,
        createdAt: now,
        updatedAt: now,
      };

      await writeNote(newNote);
      notes.value.unshift(newNote);
      currentNote.value = newNote;

      return newNote;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create note';
      console.error('Error creating note:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const saveNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    try {
      loading.value = true;
      error.value = null;

      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateNote(id, updatedData);

      // Update local state
      const noteIndex = notes.value.findIndex(note => note.id === id);
      if (noteIndex !== -1) {
        notes.value[noteIndex] = { ...notes.value[noteIndex], ...updatedData };
      }

      if (currentNote.value?.id === id) {
        currentNote.value = { ...currentNote.value, ...updatedData };
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save note';
      console.error('Error saving note:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      // Note: The db.ts file doesn't have a deleteNote function,
      // so this would need to be implemented in the database layer first
      // For now, we'll just remove from local state
      notes.value = notes.value.filter(note => note.id !== id);

      if (currentNote.value?.id === id) {
        currentNote.value = null;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete note';
      console.error('Error deleting note:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    notes,
    currentNote,
    loading,
    error,

    // Actions
    loadAllNotes,
    loadNote,
    createNote,
    saveNote,
    deleteNote,
    clearError,
  };
});
