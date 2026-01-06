<script setup lang="ts">
import { ref, watch } from "vue";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { codeToHtml } from "shiki";
import { useColorMode } from "@vueuse/core";

const mode = useColorMode();

// Configure Marked to use the Shiki highlighter
const marked = new Marked(
  markedHighlight({
    async: true,
    highlight(code, lang) {
      const isDark = mode.value === "dark";
      return codeToHtml(code, {
        lang,
        theme: isDark ? "github-dark" : "github-light",
      });
    },
  }),
);

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
});

const html = ref("");
watch(
  () => props.markdown,
  async (markdown) => {
    if (markdown) {
      html.value = await marked.parse(markdown);
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div class="markdown" v-html="html"></div>
</template>

<style lang="scss">
.shiki {
  overflow-x: auto;
}
</style>

<style src="@/assets/markdown.css"></style>
