<script setup lang="ts">
import { computed, ref } from 'vue';
import { FileEntryType, type FileEntry } from './types';
import { TreeItem } from '@nuxt/ui';

const model = defineModel<FileEntry[]>({ required: true });

const emit = defineEmits<{
  select: [file: FileEntry];
}>();

const expanded = ref<string[]>([]);
const loadingPaths = ref<Set<string>>(new Set());

function getIcon(name: string, isFolder: boolean, isLoading: boolean = false): string {
  if (isLoading) return 'i-lucide-loader-circle';
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
    const isLoading = loadingPaths.value.has(path);
    const item: TreeItem = {
      label: entry.name,
      icon: getIcon(entry.name, isFolder, isLoading),
      ui: {
        linkLeadingIcon: isLoading ? "animate-spin" : "",
      } as TreeItem['ui'],
      file: entry,
      value: path,
    };
    if (entry.children) {
      item.children = toTreeItems(entry.children, path);
    }
    return item;
  });
}

function findFileByPath(files: FileEntry[], segments: string[]): FileEntry | null {
  const [current, ...rest] = segments;
  const found = files.find((f) => f.name === current);
  if (!found) return null;
  if (rest.length === 0) return found;
  return found.children ? findFileByPath(found.children, rest) : null;
}

const defer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function listFiles(path: string): Promise<FileEntry[]> {
  // Mock API - replace with actual API call
  console.log('Fetching files for:', path);
  await defer(1000);
  return [
    { name: 'index.ts', content: '// index file', type: FileEntryType.File },
    { name: 'utils.ts', content: '// utils file', type: FileEntryType.File },
    { name: 'nested', type: FileEntryType.Folder },
  ];
}

const items = computed(() => toTreeItems(model.value));

async function onToggle(e: Event, item: any) {
  const path = item.value!;
  const segments = path.split('/');
  const entry = findFileByPath(model.value, segments);
  if (!entry) return;

  if (item.file.type === FileEntryType.Folder) {
    const idx = expanded.value.findIndex((p) => p === path);
    e.preventDefault();
    if (idx === -1) {
      if (!entry.children) {
        loadingPaths.value.add(path);
        try {
          entry.children = await listFiles(path);
        } finally {
          loadingPaths.value.delete(path);
        }
      }
      expanded.value.push(path);
    } else {
      expanded.value.splice(idx, 1);
    }
  } else {
    emit('select', entry);
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <header class="flex items-center gap-1 p-1 h-10">
      <h1 class="text-lg font-semibold truncate">My Project</h1>
      <div class="flex-1"></div>
      <UButton size="sm" icon="i-lucide-file-plus" />
      <UButton size="sm" icon="i-lucide-folder-plus" />
    </header>
    <UTree
      class="flex-1 min-h-0"
      v-model:expanded="expanded"
      :get-key="e => e.value!"
      :items="items"
      @toggle="onToggle"
    />
  </div>
</template>
