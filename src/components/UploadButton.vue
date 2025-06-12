<script setup lang="ts">
import { ref } from 'vue';
const input = ref();
</script>

<template>
  <UButton class="rounded-full" variant="soft" icon="i-mdi-paperclip" @click="input.click()" />
  <input ref="input" type="file" hidden />
</template>

<style lang="scss" scoped>
</style>