<script lang="ts" setup>
import { Background } from '@vue-flow/background';

const props = defineProps<{ isDragOver: boolean }>();
</script>

<template>
  <div
    class="relative w-full h-full pointer-events-none transition-colors duration-200 ease"
    :class="[
      isDragOver ? 'bg-[#e7f3ffaa]' : 'bg-transparent'
    ]"
  >
    <Background :size="2" :gap="20" pattern-color="#BDBDBD" />
    <div class="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
      <p v-if="isDragOver">Drop here</p>
    </div>
  </div>
</template>
