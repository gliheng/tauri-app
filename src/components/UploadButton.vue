<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'select-file', files: FileList): void;
}>();

const input = ref();
</script>

<template>
  <UTooltip text="Upload files">
    <UButton
      class="rounded-full"
      variant="soft"
      color="primary"
      icon="i-mdi-paperclip"
      size="sm"
      @click="input.click()"
      :disabled="disabled"
    />
  </UTooltip>
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