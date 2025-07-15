<script setup lang="ts">
import { useNoteStore } from "@/stores/note";
import "rich-editor";

const store = useNoteStore();
</script>

<template>
  <rich-editor />
</template>
