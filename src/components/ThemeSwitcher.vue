<script setup>
import { useColorMode } from "@vueuse/core";

const mode = useColorMode();
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    :icon="mode === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
    @click="mode = mode === 'dark' ? 'light' : 'dark'"
  />
</template>
