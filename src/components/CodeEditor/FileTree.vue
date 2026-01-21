<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { FileEntryType, type FileEntry } from './types';
import { TreeItem } from '@nuxt/ui';
import { EDITOR_ACTIONS } from '@/constants';
import FileTreeItem from './FileTreeItem.vue';

interface FileTreeItem extends TreeItem {
  file: FileEntry;
}

const props = defineProps<{
  cwd: string;
}>();

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
    case 'tsx': return 'i-vscode-icons:file-type-typescript';
    case 'js': return 'i-vscode-icons:file-type-js';
    case 'json': return 'i-vscode-icons:file-type-json';
    case 'md': return 'i-vscode-icons:file-type-markdown';
    case 'css': return 'i-vscode-icons:file-type-css';
    case 'scss': return 'i-vscode-icons:file-type-scss';
    case 'html': return 'i-vscode-icons:file-type-html';
    default: return 'i-vscode-icons:default-file';
  }
}

function toTreeItems(entries: FileEntry[], parentPath = ''): FileTreeItem[] {
  return entries.map((entry) => {
    const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    const isFolder = entry.type === FileEntryType.Folder;
    const isLoading = loadingPaths.value.has(path);
    const item: FileTreeItem = {
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

const { listFiles } = inject(EDITOR_ACTIONS);

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

const selected = ref<FileTreeItem | undefined>();

function onAddFile() {
  // TODO: Add file
}

function onAddFolder() {
  // TODO: Add folder
}

function onRenameStart(item: any) {
  item.slot = 'editing'
  item.editingValue = item.file.name;
}

async function onRenameEnd(item: any) {
  if (item.editingValue && item.editingValue !== item.file.name) {
    const oldPath = item.value!;
    const segments = oldPath.split('/');
    segments.pop();
    segments.push(item.editingValue);
    const newPath = segments.join('/');

    // Check if target path already exists in the tree
    if (!fileExistsInTree(model.value, newPath)) {
      try {
        await invoke('rename_file', {
          oldPath: `${props.cwd}/${oldPath}`,
          newPath: `${props.cwd}/${newPath}`
        });
        // Only update the tree after successful rename
        renameFileInTree(model.value, oldPath, newPath);
      } catch (error) {
        console.error('Failed to rename file:', error);
      }
    }
  }
  delete (item as any).slot;
}

async function onRenameKeydown(event: KeyboardEvent, item: any) {
  const { key } = event;
  if (key === 'Enter') {
    onRenameEnd(item);
  } else if (key === 'Escape') {
    delete (item as any).slot;
  }
}

async function onDeleteItem(item: any) {
  const path = item.value;

  try {
    await invoke('delete_file', {
      path: `${props.cwd}/${path}`
    });
    deleteFileFromTree(model.value, path);
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

function updatePathsRecursively(entry: FileEntry, oldPathPrefix: string, newPathPrefix: string) {
  if (entry.path.startsWith(oldPathPrefix)) {
    entry.path = newPathPrefix + entry.path.slice(oldPathPrefix.length);
  }
  if (entry.children) {
    for (const child of entry.children) {
      updatePathsRecursively(child, oldPathPrefix, newPathPrefix);
    }
  }
}

function renameFileInTree(entries: FileEntry[], oldPath: string, newPath: string): boolean {
  const oldSegments = oldPath.split('/');
  const newSegments = newPath.split('/');
  const oldName = oldSegments.pop()!;
  const newName = newSegments.pop()!;
  const parentSegments = oldSegments;

  // Find parent directory
  let parent = entries;
  for (const segment of parentSegments) {
    const found = parent.find(e => e.name === segment);
    if (!found || !found.children) return false;
    parent = found.children;
  }

  // Find and rename the file/folder
  const file = parent.find(e => e.name === oldName);
  if (file) {
    const oldFullPath = file.path;
    const newFullPath = file.path.slice(0, -oldName.length) + newName;
    file.name = newName;
    updatePathsRecursively(file, oldFullPath, newFullPath);
    return true;
  }
  return false;
}

function deleteFileFromTree(entries: FileEntry[], path: string): boolean {
  const segments = path.split('/');
  const name = segments.pop()!;

  // Find parent directory
  let parent = entries;
  for (const segment of segments) {
    const found = parent.find(e => e.name === segment);
    if (!found || !found.children) return false;
    parent = found.children;
  }

  // Find and remove the file
  const idx = parent.findIndex(e => e.name === name);
  if (idx !== -1) {
    parent.splice(idx, 1);
    return true;
  }
  return false;
}

function fileExistsInTree(entries: FileEntry[], path: string): boolean {
  const segments = path.split('/');
  return Boolean(findFileByPath(entries, segments));
}
</script>

<template>
  <div class="h-full flex flex-col">
    <header class="flex items-center gap-1 p-1 h-10" data-tauri-drag-region>
      <h1 class="text-lg font-semibold truncate select-none" data-tauri-drag-region>Workspace Files</h1>
      <div class="flex-1"></div>
      <UTooltip text="Add file">
        <UButton size="sm" icon="i-lucide-file-plus" @click="onAddFile" />
      </UTooltip>
      <UTooltip text="Add folder">
        <UButton size="sm" icon="i-lucide-folder-plus" @click="onAddFolder" />
      </UTooltip>
    </header>
    <div class="flex-1 min-h-0 overflow-auto">
      <UTree
        class="min-w-full w-full"
        v-model:expanded="expanded"
        v-model="selected"
        :get-key="e => e.value!"
        :items="items"
        @toggle="onToggle"
        virtualize
      >
        <template #item="{ item }">
          <FileTreeItem :icon="item.icon" :label="item.label" @rename="() => onRenameStart(item)" @delete="() => onDeleteItem(item)" />
        </template>
        <template #editing="{ item }">
          <UInput
            class="w-full -my-1"
            size="xs"
            v-model="(item as FileTreeItem).editingValue"
            autofocus
            @blur="() => onRenameEnd(item)"
            @keydown.stop="(evt: KeyboardEvent) => onRenameKeydown(evt, item)"
            @keyup.stop
          />
        </template>
      </UTree>
    </div>
  </div>
</template>
