<script setup lang="ts">
import { useTemplateRef, watch } from 'vue';

interface CommandItem {
  name: string;
  description: string;
}

const props = defineProps<{
  commandItems: CommandItem[];
  selectedIndex: number;
  floatingStyles: Record<string, string>;
}>();

const emit = defineEmits<{
  select: [index: number];
}>();

const scrollArea = useTemplateRef('scrollArea');

watch(() => props.selectedIndex, (index) => {
  scrollArea.value?.virtualizer?.scrollToIndex(index, { align: 'auto' });
});
</script>

<template>
  <div
    class="fixed z-50"
    :style="floatingStyles"
  >
    <div class="bg-white border border-gray-200 rounded-md shadow-lg w-64">
      <UScrollArea
        ref="scrollArea"
        v-if="commandItems.length > 0"
        v-slot="{ item, index }"
        :items="commandItems"
        :virtualize="{ estimateSize: 64 }"
        class="max-h-48"
        :ui="{ viewport: 'p-1' }"
      >
        <SlashCommandItem
          :key="item.name"
          :item="item"
          :selected="index === selectedIndex"
          @click="emit('select', index)"
        />
      </UScrollArea>
      <div v-else class="text-gray-500 text-sm p-2 text-center">
        No results found
      </div>
    </div>
  </div>
</template>
