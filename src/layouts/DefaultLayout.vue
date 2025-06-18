<script setup lang="ts">
import { ref } from "vue";
import { useElementSize } from "@vueuse/core";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import WindowHeader from "@/components/WindowHeader.vue";
import { computed } from "vue";

const root = ref(null);

const { width, height } = useElementSize(root);
const collapsed = computed(() => (56 / width.value) * 100);
const minSize = computed(() => (200 / width.value) * 100);
</script>

<template>
  <div class="h-screen" ref="root">
    <SplitterGroup direction="horizontal" coll>
      <SplitterPanel
        collapsible
        :default-size="collapsed"
        :collapsed-size="collapsed"
        :min-size="minSize"
      >
        <aside class="flex-1 size-full bg-zinc-400">hello</aside>
      </SplitterPanel>
      <SplitterResizeHandle />
      <SplitterPanel :min-size="50">
        <div class="h-full flex flex-col">
          <WindowHeader />
          <main class="size-full flex-1 flex flex-col min-h-0">
            <slot></slot>
          </main>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>

<style lang="scss" scoped></style>
