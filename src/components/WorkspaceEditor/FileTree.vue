<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { FileEntryType, type FileEntry } from './types';
import { TreeItem } from '@nuxt/ui';
import { EDITOR_ACTIONS } from '@/constants';
import FileTreeItem from './FileTreeItem.vue';
import { getFileIcon } from '@/utils/file';
import { useArtifactsStore } from '@/stores/artifacts';

interface FileTreeItem extends TreeItem {
  file: FileEntry;
  isCreating?: boolean;
}

const props = defineProps<{
  cwd: string;
  artifactKey: string;
}>();

const model = defineModel<FileEntry[]>({ required: true });

const emit = defineEmits<{
  select: [file: FileEntry];
}>();

const selected = ref<FileTreeItem | undefined>();
const artifactsStore = useArtifactsStore();
const expanded = ref<string[]>([]);
const loadingPaths = ref<Set<string>>(new Set());
const creatingEntry = ref<{ type: FileEntryType; parentPath: string } | null>(null);

function getIcon(name: string, isFolder: boolean, isLoading: boolean = false): string {
  if (isLoading) return 'i-lucide-loader-circle';
  if (isFolder) return 'i-vscode-icons:default-folder';
  return getFileIcon(name);
}

function toTreeItems(entries: FileEntry[], parentPath = ''): FileTreeItem[] {
  const items = entries.map((entry) => {
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

  // Add temporary creating entry if applicable
  if (creatingEntry.value && creatingEntry.value.parentPath === parentPath) {
    const tempEntry: FileEntry = {
      name: '',
      type: creatingEntry.value.type,
      path: parentPath ? `${parentPath}/__creating__` : '__creating__',
    };
    const tempItem: FileTreeItem = {
      label: '',
      icon: getIcon('', creatingEntry.value.type === FileEntryType.Folder),
      file: tempEntry,
      value: tempEntry.path,
      isCreating: true,
    };
    
    if (creatingEntry.value.type === FileEntryType.Folder) {
      // Folders go at the top
      items.unshift(tempItem);
    } else {
      // Files go after all folders
      const firstFileIndex = items.findIndex(item => item.file.type === FileEntryType.File);
      if (firstFileIndex === -1) {
        // No files exist, add at the end
        items.push(tempItem);
      } else {
        // Insert before the first file
        items.splice(firstFileIndex, 0, tempItem);
      }
    }
  }

  return items;
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

  // Set context for both files and folders when selected
  if ((e as any).detail.isSelected) {
    artifactsStore.setContext(props.artifactKey, {
      file: { path: entry.path },
      selection: undefined,
    });
  } else {
    artifactsStore.setContext(props.artifactKey, {
      file: undefined,
      selection: undefined,
    });
  }
}

function onAddFile() {
  const parentPath = getSelectedFolderPath();
  creatingEntry.value = { type: FileEntryType.File, parentPath };
  // Ensure parent folder is expanded
  if (parentPath && !expanded.value.includes(parentPath)) {
    expanded.value.push(parentPath);
  }
}

function onAddFolder() {
  const parentPath = getSelectedFolderPath();
  creatingEntry.value = { type: FileEntryType.Folder, parentPath };
  // Ensure parent folder is expanded
  if (parentPath && !expanded.value.includes(parentPath)) {
    expanded.value.push(parentPath);
  }
}

function getSelectedFolderPath(): string {
  if (!selected.value) return '';
  
  // If selected item is a folder, use it as parent
  if (selected.value.file.type === FileEntryType.Folder) {
    return selected.value.value!;
  }
  
  // If selected item is a file, use its parent folder
  const path = selected.value.value!;
  const segments = path.split('/');
  segments.pop(); // Remove file name
  return segments.join('/');
}

async function onCreateEntry(name: string) {
  if (!creatingEntry.value || !name.trim()) {
    creatingEntry.value = null;
    return;
  }

  const { type, parentPath } = creatingEntry.value;
  const relativePath = parentPath ? `${parentPath}/${name}` : name;
  const fullPath = `${props.cwd}/${relativePath}`;

  try {
    if (type === FileEntryType.File) {
      await invoke('create_file', { path: fullPath });
    } else {
      await invoke('create_directory', { path: fullPath });
    }

    // Add to tree
    const newEntry: FileEntry = {
      name,
      type,
      path: fullPath,
      children: type === FileEntryType.Folder ? [] : undefined,
    };

    addFileToTree(model.value, parentPath, newEntry);
    creatingEntry.value = null;
  } catch (error) {
    console.error('Failed to create entry:', error);
    creatingEntry.value = null;
  }
}

function onCancelCreate() {
  creatingEntry.value = null;
}

function addFileToTree(entries: FileEntry[], parentPath: string, newEntry: FileEntry): boolean {
  if (!parentPath) {
    // Add to root
    entries.push(newEntry);
    entries.sort((a, b) => {
      // Folders first, then alphabetically
      if (a.type !== b.type) {
        return a.type === FileEntryType.Folder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    return true;
  }

  const segments = parentPath.split('/');
  let parent = entries;
  for (const segment of segments) {
    const found = parent.find(e => e.name === segment);
    if (!found || !found.children) return false;
    parent = found.children;
  }

  parent.push(newEntry);
  parent.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === FileEntryType.Folder ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  return true;
}

async function onRenameItem(item: FileTreeItem, newName: string) {
  const oldPath = item.value!;
  const segments = oldPath.split('/');
  segments.pop();
  segments.push(newName);
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

async function onDeleteItem(item: FileTreeItem) {
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

async function onRevealItem(item: FileTreeItem) {
  const path = `${props.cwd}/${item.value}`;

  try {
    await revealItemInDir(path);
  } catch (error) {
    console.error('Failed to reveal item:', error);
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
      <h1 class="text-lg font-semibold truncate select-none" data-tauri-drag-region>Files</h1>
      <div class="flex-1"></div>
      <UTooltip text="Add file">
        <UButton size="sm" icon="i-lucide-file-plus" @click="onAddFile" @mousedown.prevent />
      </UTooltip>
      <UTooltip text="Add folder">
        <UButton size="sm" icon="i-lucide-folder-plus" @click="onAddFolder" @mousedown.prevent />
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
          <FileTreeItem
            :icon="item.icon"
            :label="item.label"
            :default-editing="item.isCreating"
            @edit="(newName: string) => item.isCreating ? onCreateEntry(newName) : onRenameItem(item, newName)"
            @cancel-edit="item.isCreating ? onCancelCreate() : undefined"
            @delete="() => onDeleteItem(item)"
            @reveal="() => onRevealItem(item)"
          />
        </template>
      </UTree>
    </div>
  </div>
</template>
