<script setup lang="ts">
interface Props {
  options: Array<{
    value: string;
    label: string;
  }>;
}

const props = defineProps<Props>();
const model = defineModel<string>();

const updateValue = (value: string) => {
  model.value = value;
};
</script>

<template>
  <UFieldGroup orientation="horizontal">
    <UButton
      v-for="option in options"
      :key="option.value"
      :color="model === option.value ? 'primary' : 'neutral'"
      :variant="model === option.value ? 'solid' : 'subtle'"
      :label="option.label"
      @click="updateValue(option.value)"
    />
  </UFieldGroup>
</template>