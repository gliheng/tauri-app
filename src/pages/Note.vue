<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useNoteStore } from "@/stores/note";
import { useTabsStore } from "@/stores/tabs";
import { MilkdownProvider } from "@milkdown/vue";
import MilkdownEditor from "@/components/MilkdownEditor.vue";

const store = useNoteStore();
const { expanded } = storeToRefs(useTabsStore());
</script>

<template>
  <MilkdownProvider>
    <MilkdownEditor />
  </MilkdownProvider>
</template>
