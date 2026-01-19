<script setup lang="ts">
import { PropType } from 'vue';

interface MentionItem {
  id: string;
  label: string;
  path: string;
  is_dir: boolean;
}

const props = defineProps({
  item: {
    type: Object as PropType<MentionItem>,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

const getIcon = () => {
  if (props.item.is_dir) {
    return 'i-lucide-folder';
  }
  
  const extension = props.item.label.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'i-lucide-code';
    case 'json':
      return 'i-lucide-braces';
    case 'md':
      return 'i-lucide-file-text';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return 'i-lucide-image';
    case 'pdf':
      return 'i-lucide-file-text';
    default:
      return 'i-lucide-file';
  }
};
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
      selected 
        ? 'bg-blue-50 text-blue-900' 
        : 'hover:bg-gray-50 text-gray-900'
    ]"
  >
    <UIcon :name="getIcon()" class="flex-shrink-0 w-4 h-4 text-gray-500" />
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium truncate">{{ item.label }}</div>
      <div class="text-xs text-gray-500 truncate">{{ item.path }}</div>
    </div>
  </div>
</template>
