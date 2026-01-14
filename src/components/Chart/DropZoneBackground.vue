<script lang="ts" setup>
import { Background } from '@vue-flow/background';
</script>

<template>
  <div class="relative w-full h-full">
    <Background :size="2" :gap="20" pattern-color="#BDBDBD" />
    <div class="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
      <slot></slot>
    </div>
  </div>
</template>
