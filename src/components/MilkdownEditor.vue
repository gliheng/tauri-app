<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
// import "@milkdown/crepe/theme/frame-dark.css";


const props = defineProps({
  value: String,
});

useEditor((root) => {
  const crepe = new Crepe({
    root,
    defaultValue: props.value,
  });
  return crepe;
})
</script>

<template>
  <Milkdown />
</template>

<style>
[data-milkdown-root] {
  min-height: 100%;
  overflow-y: auto;
}
</style>
