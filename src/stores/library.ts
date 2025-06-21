import { ref } from "vue";
import { defineStore } from "pinia";

export const createLibraryStore = (id: string) => {
  return defineStore(`library-${id}`, () => {
    const docs = ref<{ name: string }[]>([]);
    const name = ref<string>("Unnamed library");
    const active = ref<string>();
    return {
      docs,
      name,
      active,
      addDoc(doc: { name: string }) {
        docs.value.push(doc);
      },
      removeDoc(index: number) {
        docs.value.splice(index, 1);
      },
    };
  });
};
