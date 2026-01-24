<script setup lang="ts">
import { PropType } from 'vue';
import { getFileIcon } from '@/utils/file';

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
    return 'i-vscode-icons:default-folder';
  }
  return getFileIcon(props.item.label);
};

const { item } = props;
const dir = item.path.endsWith(item.label) ? item.path.slice(0, -item.label.length) : item.path;
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
    <div class="flex-1 min-w-0 flex flex-row gap-2 items-center">
      <div class="text-sm font-medium whitespace-nowrap">{{ item.label }}</div>
      <div class="text-xs truncate">{{ dir }}</div>
    </div>
  </div>
</template>
