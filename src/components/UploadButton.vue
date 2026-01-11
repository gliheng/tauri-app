<script setup lang="ts">
import { ref } from 'vue';

defineEmits<{
  (e: 'select-file', files: FileList): void;
}>();

const input = ref();
</script>

<template>
  <UButton
    class="rounded-full"
    variant="soft"
    color="primary"
    icon="i-mdi-paperclip"
    @click="input.click()"
  />
  <input
    ref="input"
    type="file"
    multiple
    hidden
    @change="$emit('select-file', input.files)"
  />
</template>

<style lang="scss" scoped>
</style>