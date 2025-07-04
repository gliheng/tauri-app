<script setup lang="ts">
import { useRoute } from "vue-router";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { createLibraryStore } from "@/stores/library";
import 'rich-editor';

const route = useRoute();
const useStore = createLibraryStore(route.params.id as string);
const store = useStore();
</script>

<template>
  <SplitterGroup direction="horizontal">
    <SplitterPanel
      class="bg-elevated flex flex-col items-center px-2 gap-2"
      :default-size="20"
      :min-size="20"
      :max-size="80"
    >
      <ul class="flex flex-col gap-1">
        <li v-for="doc of store.docs" :key="doc.name">{{ doc.name }}</li>
      </ul>
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="subtle"
        @click="store.addDoc({ name: 'New Document' })"
        >Add document</UButton
      >
    </SplitterPanel>
    <SplitterResizeHandle class="w-0.5 splitter-handle" />
    <SplitterPanel
      :default-size="80"
    >
      <rich-editor />
    </SplitterPanel>
  </SplitterGroup>
</template>

<style lang="scss" scoped>
.splitter-handle {
  transition: background-color 0.3s ease-in-out;
  background-color: var(--ui-border);
  &[data-state="drag"],
  &[data-state="hover"] {
    background-color: var(--ui-color-primary-500);
  }
}
</style>
