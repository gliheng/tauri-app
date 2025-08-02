<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { Crepe } from "@milkdown/crepe";

const model = defineModel({
  type: String,
  required: true,
});

useEditor((root) => {
  const crepe = new Crepe({
    root,
    defaultValue: model.value,
  });
  crepe.on((listener) => {
    listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
      if (markdown !== prevMarkdown) {
        model.value = markdown;
      }
    });
  });
  return crepe;
});
</script>

<template>
  <Milkdown />
</template>

<style lang="scss" src="@/assets/milkdown.scss"></style>
