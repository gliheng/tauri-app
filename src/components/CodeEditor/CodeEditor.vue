<script setup lang="ts">
import { ref } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import FileTree from "./FileTree.vue";
import Editor from "./Editor.vue";
import { FileEntryType, type FileEntry } from "./types";

const file = ref<FileEntry>();
const fileSystem = ref<FileEntry[]>([
  {
    name: 'app.vue',
    content: 'console.log("Hello World!")',
    type: FileEntryType.File,
  },
  {
    name: 'A directory',
    type: FileEntryType.Folder,
  },
]);

function findFileByPath(files: FileEntry[], segments: string[]): FileEntry | null {
  const [current, ...rest] = segments;
  const found = files.find((f) => f.name === current);
  if (!found) return null;
  if (rest.length === 0) return found;
  return found.children ? findFileByPath(found.children, rest) : null;
}

async function listFiles(path: string): Promise<FileEntry[]> {
  // Mock API - replace with actual API call
  console.log('Fetching files for:', path);
  return [
    { name: 'index.ts', content: '// index file', type: FileEntryType.File },
    { name: 'utils.ts', content: '// utils file', type: FileEntryType.File },
    { name: 'nested', type: FileEntryType.Folder },
  ];
}

async function onToggle(path: string) {
  const segments = path.split('/');
  const entry = findFileByPath(fileSystem.value, segments);
  if (!entry) return;

  if (entry.type === FileEntryType.Folder) {
    if (!entry.children) {
      entry.children = await listFiles(path);
    }
  } else {
    file.value = entry;
  }
}
</script>

<template>
  <SplitterGroup class="flex-1" direction="horizontal">
    <SplitterPanel :default-size="20">
      <FileTree :files="fileSystem" @toggle="onToggle" />
    </SplitterPanel>
    <SplitterResizeHandle class="w-0.5 splitter-handle" />
    <SplitterPanel>
      <KeepAlive>
        <Editor v-if="file" :key="file.name" v-model="file.content!" />
        <div v-else class="h-full flex flex-col items-center justify-center text-gray-400">
          <UIcon name="i-lucide-file-code" class="w-16 h-16 mb-4 opacity-50" />
          <p class="text-lg">No file selected</p>
          <p class="text-sm mt-1">Select a file from the tree to start editing</p>
        </div>
      </KeepAlive>
    </SplitterPanel>
  </SplitterGroup>
</template>

<style lang="scss" scoped>
.splitter-handle {
  transition: background-color 0.3s ease-in-out;
  background-color: var(--ui-border);
  &[data-state="drag"],
  &[data-state="hover"] {
    background-color: var(--ui-color-primary-500);
  }
}
</style>