<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

const unlisten = appWindow.onResized(async ({ payload: size }) => {
  isMaximized.value = await appWindow.isMaximized();
});

onUnmounted(() => {
  unlisten();
});

const isMaximized = ref(false);
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

const isAppleDevice = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
</script>

<template>
  <div class="flex flex-row px-2 gap-1 items-center select-none">
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
