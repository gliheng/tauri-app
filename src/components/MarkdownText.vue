<script setup lang="ts">
import { computed } from "vue";
import MarkdownRender from "markstream-vue";
import { useColorMode } from "@vueuse/core";
import { enableMermaid } from 'markstream-vue'
import "markstream-vue/index.css";

enableMermaid();

const mode = useColorMode();

const props = withDefaults(
  defineProps<{
    markdown: string;
    streaming?: boolean;
  }>(),
  {
    streaming: false,
  }
);

const isDark = computed(() => mode.value === "dark");
const maxLiveNodes = computed(() => (props.streaming ? 0 : 320));
</script>

<template>
  <div class="markdown">
    <MarkdownRender
      :content="props.markdown"
      :final="!props.streaming"
      :is-dark="isDark"
      :max-live-nodes="maxLiveNodes"
    />
  </div>
</template>
