<script setup lang="ts">
import { computed, PropType } from "vue";
import type { AvailableCommand } from "@/hooks/useAcp";
import type { DropdownMenuItem } from "@nuxt/ui";

const props = defineProps({
  availableCommands: {
    type: Array as PropType<AvailableCommand[]>,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  select: [command: AvailableCommand];
}>();

const items = computed(() => {
  return props.availableCommands.map((command): DropdownMenuItem => ({
    label: `/${command.name}`,
    description: command.description,
    onSelect() {
      emit("select", command);
    },
  }));
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    :disabled="disabled || availableCommands.length === 0"
    :ui="{
      content: 'min-w-fit',
    }"
  >
    <UButton
      icon="i-lucide-command"
      color="primary"
      variant="soft"
      size="sm"
      :disabled="disabled || availableCommands.length === 0"
    />
  </UDropdownMenu>
</template>
