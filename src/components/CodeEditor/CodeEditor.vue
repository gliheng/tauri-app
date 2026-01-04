<script setup lang="ts">
import { provide, ref } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { invoke } from "@tauri-apps/api/core";
import FileTree from "./FileTree.vue";
import Editor from "./Editor.vue";
import Terminal from "./Terminal.vue";
import { FileEntryType, type FileEntry } from "./types";
import { EDITOR_ACTIONS } from "@/constants";

const props = defineProps({
  cwd: {
    type: String,
    required: true,
  },
});

const file = ref<FileEntry>();
const fileSystem = ref<FileEntry[]>([]);

interface FileNode {
  name: string;
  path: string;
  is_file: boolean;
  is_dir: boolean;
  children?: FileNode[];
  size?: number;
}

function convertFileNodeToEntry(node: FileNode, basePath: string): FileEntry {
  const relativePath = node.path.startsWith(basePath)
    ? node.path.slice(basePath.length).replace(/^\//, '')
    : node.path;
  
  return {
    name: node.name,
    type: node.is_dir ? FileEntryType.Folder : FileEntryType.File,
    path: relativePath,
    children: node.children?.map(child => convertFileNodeToEntry(child, basePath)),
  };
}

async function listFiles(relativePath: string): Promise<FileEntry[]> {
  const fullPath = relativePath 
    ? `${props.cwd}/${relativePath}` 
    : props.cwd;
  
  try {
    const result = await invoke<FileNode>("read_directory", { path: fullPath });
    return result.children?.map(child => convertFileNodeToEntry(child, props.cwd)) || [];
  } catch (error) {
    console.error('Failed to read directory:', error);
    throw error;
  }
}

fileSystem.value = await listFiles('');

async function loadFileContent(relativePath: string): Promise<string> {
  const fullPath = `${props.cwd}/${relativePath}`;
  try {
    const content = await invoke<string>("read_file", { path: fullPath });
    return content;
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
}

async function saveFileContent(relativePath: string, content: string): Promise<void> {
  const fullPath = `${props.cwd}/${relativePath}`;
  try {
    await invoke("write_file", { path: fullPath, content });
  } catch (error) {
    console.error('Failed to write file:', error);
    throw error;
  }
}

provide(EDITOR_ACTIONS, {
  listFiles,
  loadFileContent,
  saveFileContent,
});

async function onSelect(entry: FileEntry) {
  if (entry.type === FileEntryType.File) {
    const content = await loadFileContent(entry.path);
    file.value = { ...entry, content };
  }
}

const showTerminal = ref(false);
</script>

<template>
  <SplitterGroup class="flex-1" direction="horizontal">
    <SplitterPanel :default-size="40">
      <FileTree v-model="fileSystem" @select="onSelect" />
    </SplitterPanel>
    <SplitterResizeHandle class="w-0.5 splitter-handle" />
    <SplitterPanel>
      <div class="flex flex-col h-full">
        <SplitterGroup direction="vertical" class="flex-1">
          <SplitterPanel :default-size="60">
            <header class="p-1 border-b border-gray-200 h-10 flex items-center">
              <h2 class="text-sm font-medium">{{ file?.name }}</h2>
              <div class="flex-1"></div>
              <UButton size="sm" icon="i-lucide-square-terminal" @click="showTerminal = !showTerminal" />
            </header>
            <KeepAlive :max="10">
              <Editor v-if="file" :key="file.path" class="h-full" v-model="file.content!" />
            </KeepAlive>
            <div v-if="!file" class="h-full flex flex-col items-center justify-center text-gray-400">
              <UIcon name="i-lucide-file-code" class="w-16 h-16 mb-4 opacity-50" />
              <p class="text-lg">No file selected</p>
              <p class="text-sm mt-1">Select a file from the tree to start editing</p>
            </div>
          </SplitterPanel>
          <template v-if="showTerminal">
            <SplitterResizeHandle class="h-0.5 splitter-handle" />
            <SplitterPanel :default-size="40">
              <Terminal :cwd="cwd" />
            </SplitterPanel>
          </template>
        </SplitterGroup>
      </div>
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