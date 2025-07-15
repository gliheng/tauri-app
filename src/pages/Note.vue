<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useNoteStore } from "@/stores/note";
import { useTabsStore } from "@/stores/tabs";
import "rich-editor";

const store = useNoteStore();
const { expanded } = storeToRefs(useTabsStore());
const viewWidth = computed(() =>
  expanded.value ? undefined : Math.min(screen.width / 3, 600),
);
</script>

<template>
  <rich-editor :width="viewWidth" />
</template>
