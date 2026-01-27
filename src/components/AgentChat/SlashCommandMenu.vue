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
  >
    <UTooltip text="Select command to run">
      <UButton
        icon="i-lucide-command"
        color="primary"
        variant="soft"
        size="sm"
        :disabled="disabled || availableCommands.length === 0"
        @mousedown.prevent
      />
    </UTooltip>
    <template #content>
      <div class="bg-white border border-gray-200 rounded-md shadow-lg w-64">
      <UScrollArea
        v-if="availableCommands.length > 0"
        v-slot="{ item }"
        :items="availableCommands"
        :virtualize="{ estimateSize: 64 }"
        class="max-h-64"
        :ui="{ viewport: 'p-1' }"
      >
        <UButton
          variant="ghost"
          color="neutral"
          class="justify-start w-full"
          @click="emit('select', item)"
        >
          <template #default>
            <span data-slot="itemWrapper" class="flex-1 flex flex-col text-start min-w-0">
              <span data-slot="itemLabel" class="truncate">/{{ item.name }}</span>
              <span data-slot="itemDescription" class="truncate text-muted">{{ item.description }}</span>
            </span>
            <span data-slot="itemTrailing" class="ms-auto inline-flex gap-1.5 items-center">
            </span>
          </template>
        </UButton>
      </UScrollArea>
      </div>
    </template>
  </UPopover>
</template>
