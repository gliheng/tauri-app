<script setup lang="ts">
import { PropType } from 'vue';

interface CommandItem {
  name: string;
  description: string;
}

const props = defineProps({
  item: {
    type: Object as PropType<CommandItem>,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    :class="[
      'flex flex-col gap-1 p-2 rounded cursor-pointer transition-colors',
      selected 
        ? 'bg-blue-50 text-blue-900' 
        : 'hover:bg-gray-50 text-gray-900'
    ]"
  >
    <div class="text-sm font-medium">/{{ item.name }}</div>
    <div class="text-xs">{{ item.description }}</div>
  </div>
</template>
