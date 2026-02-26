<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  options: Array<{
    value: string;
    label: string;
    icon: string | Component;
  }>;
}

const props = defineProps<Props>();
const model = defineModel<string>();

const updateValue = (value: string) => {
  model.value = value;
};
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <UButton
      v-for="option in options"
      :key="option.value"
      size="xl"
      :color="model === option.value ? 'primary' : 'neutral'"
      :variant="model === option.value ? 'solid' : 'subtle'"
      :label="option.label"
      :icon="option.icon"
      @click="updateValue(option.value)"
    />
  </div>
</template>