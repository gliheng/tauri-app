<script setup lang="ts">
import { PropType } from "vue";
import type { Mode } from "@/services/acp";

defineProps({
  availableModes: {
    type: Array as PropType<Mode[]>,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const selectedModeId = defineModel<string>({ required: true });
</script>

<template>
  <USelect
    v-model="selectedModeId"
    label-key="name"
    value-key="id"
    placeholder="Select mode"
    :items="availableModes"
    :disabled="disabled"
    :ui="{
      content: 'min-w-fit',
    }"
  >
  </USelect>
</template>
