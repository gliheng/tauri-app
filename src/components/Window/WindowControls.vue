<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import { debounce } from "lodash-es";

const appWindow = getCurrentWindow();
const isMaximized = ref(false);

let unlisten: UnlistenFn | undefined;
onMounted(async () => {
  let lastSize: any;
  const debouncedHandler = debounce(async ({ payload }) => {
    // Walkaround resize issue: https://github.com/tauri-apps/tauri/issues/5812
    const size = `${payload.width}::${payload.height}`;
    if (lastSize !== size) {
      lastSize = size;
      isMaximized.value = await appWindow.isMaximized();
    }
  }, 200);

  unlisten = await appWindow.onResized(debouncedHandler);
});
onUnmounted(() => {
  unlisten?.();
});

function close() {
  appWindow.close();
}
function maximize() {
  isMaximized.value = true;
  appWindow.maximize();
}
function unmaximize() {
  isMaximized.value = false;
  appWindow.unmaximize();
}
function minimize() {
  appWindow.minimize();
}
</script>

<template>
  <div class="flex flex-row gap-1 items-center select-none"
    data-tauri-drag-region
  >
    <UButton
      icon="i-mdi-window-minimize"
      color="neutral"
      variant="soft"
      @click="minimize"
    />
    <UButton
      v-if="!isMaximized"
      icon="i-mdi-window-maximize"
      color="neutral"
      variant="soft"
      @click="maximize"
    />      
    <UButton
      v-else
      icon="i-mdi-window-restore"
      color="neutral"
      variant="soft"
      @click="unmaximize"
    />      
    <UButton
      icon="i-mdi-close"
      color="neutral"
      variant="soft"
      @click="close"
    />
  </div>
</template>
