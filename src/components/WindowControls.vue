<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

function close() {
  appWindow.close();
}
function maximize() {
  appWindow.maximize();
}
function minimize() {
  appWindow.minimize();
}
</script>

<template>
  <div class="flex flex-row px-2 gap-1">
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
  </div>
</template>
