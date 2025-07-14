import { ref } from "vue";
import { defineStore } from "pinia";

export const useNoteStore = defineStore('note', () => {
  const name = ref<string>("Unnamed note");
  return {
    name,
  };
});
