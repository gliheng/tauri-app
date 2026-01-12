<script setup lang="ts">
import { PropType } from "vue";
import type { AvailableCommand } from "@/hooks/useAcp";

// Cannot use dropdown menu because clicking on it will make the input focus lost
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
</script>

<template>
  <UPopover
    :disabled="disabled || availableCommands.length === 0"
    position=""
  >
    <UButton
      icon="i-lucide-command"
      color="primary"
      variant="soft"
      size="sm"
      :disabled="disabled || availableCommands.length === 0"
      @mousedown.prevent
    />

    <template #content>
      <div class="flex flex-col gap-1 p-1">
        <UButton
          v-for="command in availableCommands"
          :key="command.name"
          variant="ghost"
          color="neutral"
          class="justify-start"
          @mousedown.prevent
          @click="emit('select', command)"
        >
          <template #default>
            <span data-slot="itemWrapper" class="flex-1 flex flex-col text-start min-w-0">
              <span data-slot="itemLabel" class="truncate">/{{ command.name }}</span>
              <span data-slot="itemDescription" class="truncate text-muted">{{ command.description }}</span>
            </span>
            <span data-slot="itemTrailing" class="ms-auto inline-flex gap-1.5 items-center">
            </span>
          </template>
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
