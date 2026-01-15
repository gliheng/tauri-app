<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { throttle } from "lodash-es";
import { getNote, writeNote, updateNote } from "@/db-sqlite";
import { NoteEditor } from "@/components/NoteEditor";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";
import NavigationSlideover from "@/components/NavigationSlideover.vue";
import { useNotesStore } from "@/stores/notes";
import { useTabsStore } from "@/stores/tabs";

const notesStore = useNotesStore();
const tabsStore = useTabsStore();
const router = useRouter();

const route = useRoute();

notesStore.loadNotes();

const noteItems = computed(() => {
  return notesStore.notes.map((note) => ({
    name: note.name,
    icon: note.icon,
    onClick: () => {
      tabsStore.openTab(`/note/${note.id}`, note.name);
      router.push({
        name: "note",
        params: { id: note.id },
      });
    },
  }));
});

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
  notesStore.loadNotes();
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
    <div class="absolute top-2 left-2 z-10">
      <NavigationSlideover
        title="Notes"
        :items="noteItems"
      />
    </div>
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
      <div class="mx-32 mt-6">
        <NoteEditor v-model="note.content" />
      </div>
    </div>
  </div>
</template>
