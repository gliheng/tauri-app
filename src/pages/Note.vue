<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { throttle } from "lodash-es";
import { getNote, writeNote, updateNote } from "@/db-sqlite";
import { MilkdownProvider } from "@milkdown/vue";
import MilkdownEditor from "@/components/MilkdownEditor.vue";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";
import { useSidebarStore } from "@/stores/sidebar";

const sidebarStore = useSidebarStore();

const route = useRoute();

const initialData = await getNote(route.params.id as string);
const note = ref(Object.assign({
  content: '',
  name: 'New Note',
  icon: 'i-lucide-sticky-note',
}, initialData));

let created = !!initialData;

const throttledWatcher = throttle(async (note) => {
  if (!created) {
    await writeNote({
      id: route.params.id as string,
      name: note.name,
      icon: note.icon,
      content: note.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created = true;
  } else {
    await updateNote(
      route.params.id as string,
      {
        content: note.content,
        name: note.name,
        icon: note.icon,
        updatedAt: new Date(),
      },
    );
  }
  sidebarStore.loadNotes();
}, 1000);

watch(note, throttledWatcher, {
  deep: true,
});

function downloadNote() {
  const blob = new Blob([note.value.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = note.value.name + ".md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 justify-center relative">
    <header class="absolute top-2 right-2 z-10">
      <UButton
        icon="i-lucide-download"
        color="neutral"
        variant="subtle"
        @click="downloadNote"
      />
    </header>
    <div class="flex-1 min-h-0 overflow-y-auto">
      <hgroup class="flex flex-row gap-2 items-center mx-32 mt-16">
        <IconEdit v-model:icon="note.icon" />
        <NameEdit v-model:name="note.name" />
      </hgroup>
      <MilkdownProvider>
        <MilkdownEditor v-model="note.content" />
      </MilkdownProvider>
    </div>
  </div>
</template>
