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
  <UTooltip text="Change Agent Mode">
    <USelect
      v-model="selectedModeId"
      label-key="name"
      value-key="id"
      variant="soft"
      placeholder="Select mode"
      :items="availableModes"
      :disabled="disabled"
      :ui="{
        content: 'min-w-fit',
        base: 'bg-primary/10 hover:bg-primary/15 text-primary-500 focus-visible:bg-primary/15',
        trailingIcon: 'text-primary-500',
      }"
    />
  </UTooltip>
</template>
