<script setup lang="ts">
interface MentionItem {
  id: string;
  label: string;
  path: string;
  is_dir: boolean;
}

defineProps<{
  mentionItems: MentionItem[];
  selectedIndex: number;
  position: { x: number; y: number };
}>();

const emit = defineEmits<{
  select: [index: number];
}>();
</script>

<template>
  <div 
    class="fixed z-50"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <div class="bg-white border border-gray-200 rounded-md shadow-lg w-64">
      <UScrollArea
        v-if="mentionItems.length > 0"
        v-slot="{ item, index }"
        :items="mentionItems"
        :virtualize="{ estimateSize: 48 }"
        class="max-h-48"
        :ui="{ viewport: 'p-1' }"
      >
        <MentionItem
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
