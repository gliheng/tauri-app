<script setup lang="ts">
import WindowHeader from "@/components/WindowHeader.vue";
</script>

<template>
  <div class="h-screen flex flex-col">
    <WindowHeader />
    <main class="flex-1 flex flex-col min-h-0">
      <slot></slot>
    </main>
  </div>
</template>

<style lang="scss" scoped></style>
