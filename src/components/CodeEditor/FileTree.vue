<script setup lang="ts">
import { computed, ref } from 'vue';
import { FileEntryType, type FileEntry } from './types';
import { TreeItem } from '@nuxt/ui';
import { useSortable } from '@vueuse/integrations/useSortable';

const props = defineProps<{
  files: FileEntry[];
}>();

const emit = defineEmits<{
  toggle: [path: string];
}>();

const expanded = ref<string[]>([]);

function getIcon(name: string, isFolder: boolean): string {
  if (isFolder) return 'i-vscode-icons:default-folder';
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'vue': return 'i-vscode-icons:file-type-vue';
    case 'ts': return 'i-vscode-icons:file-type-typescript';
    case 'js': return 'i-vscode-icons:file-type-js';
    case 'json': return 'i-vscode-icons:file-type-json';
    case 'md': return 'i-vscode-icons:file-type-markdown';
    case 'css': return 'i-vscode-icons:file-type-css';
    case 'scss': return 'i-vscode-icons:file-type-scss';
    case 'html': return 'i-vscode-icons:file-type-html';
    default: return 'i-vscode-icons:default-file';
  }
}

function toTreeItems(entries: FileEntry[], parentPath = ''): TreeItem[] {
  return entries.map((entry) => {
    const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    const isFolder = entry.type === FileEntryType.Folder;
    const item: TreeItem = {
      label: entry.name,
      icon: getIcon(entry.name, isFolder),
      type: entry.type,
      value: path,
    };
    if (entry.children) {
      item.children = toTreeItems(entry.children, path);
    }
    return item;
  });
}

const items = computed(() => toTreeItems(props.files));

function onToggle(e: Event, item: any) {
  emit('toggle', item.value!);
  if (item.type === FileEntryType.Folder) {
    const idx = expanded.value.findIndex((path) => path === item.value);
    e.preventDefault();
    if (idx === -1) {
      expanded.value.push(item.value);
    } else {
      expanded.value.splice(idx, 1);
    }
  }
}
</script>

<template>
  <div class="h-full">
    <header class="flex gap-1 p-1">
      <h1 class="text-lg font-semibold truncate">My Project</h1>
      <div class="flex-1"></div>
      <UButton size="sm" icon="i-lucide-file-plus" />
      <UButton size="sm" icon="i-lucide-folder-plus" />
    </header>
    <UTree
      :items="items"
      v-model:expanded="expanded"
      :get-key="e => e.value!"
      @toggle="onToggle"
    />
  </div>
</template>
