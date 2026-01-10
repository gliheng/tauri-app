<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isAppleDevice } from "@/utils/device";
import { UnlistenFn } from "@tauri-apps/api/event";

const appWindow = getCurrentWindow();
const isMaximized = ref(false);

let unlisten: UnlistenFn | undefined;
onMounted(async () => {
  unlisten = await appWindow.onResized(async () => {
    isMaximized.value = await appWindow.isMaximized();
  });
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
  <div class="flex flex-row px-2 gap-1 items-center select-none"
    data-tauri-drag-region
  >
    <template v-if="isAppleDevice">
      <UButton
        class="rounded-full"
        icon="i-mdi-close"
        color="error"
        size="xs"
        @click="close"
      />
      <UButton
        class="rounded-full"
        icon="i-mdi-window-minimize"
        color="warning"
        size="xs"
        @click="minimize"
      />
      <UButton
        class="rounded-full"
        icon="i-mdi-window-maximize"
        color="success"
        size="xs"
        @click="maximize"
      />
    </template>
    <template v-else>
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
    </template>
  </div>
</template>
