<script setup lang="ts">
import { provide, ref, onMounted, onUnmounted, watch } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { debounce } from "lodash-es";
import { useColorMode } from "@vueuse/core";
import FileTree from "./FileTree.vue";
import Editor from "./Editor.vue";
import DiffViewer from "./DiffViewer.vue";
import { FileEntryType, type FileEntry } from "./types";
import { EDITOR_ACTIONS } from "@/constants";
import { eventBus } from "@/utils/eventBus";
import { useArtifactsStore } from "@/stores/artifacts";

const props = defineProps({
  cwd: {
    type: String,
    required: true,
  },
});

const file = ref<FileEntry>();
const fileSystem = ref<FileEntry[]>([]);
const colorMode = useColorMode();
const artifactsStore = useArtifactsStore();
const artifactKey = `workspace::${props.cwd}`;

const isGitRepo = ref(false);
const showDiffView = ref(false);
const diffContent = ref("");

const currentSessionId = ref(`editor-${Date.now()}`);
const externallyModified = ref(false);

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
    externallyModified.value = false;
  }
}

// File watching functionality

// Start watching the base directory once on mount
watch(() => props.cwd, async (newCwd) => {
  if (newCwd) {
    checkGitRepo();
    try {
      await invoke('watch_file', {
        args: {
          session_id: currentSessionId.value,
          relative_path: '.', 
          base_path: newCwd,
        },
      });
    } catch (error) {
      console.error('Failed to watch directory:', error);
    }
  }
}, { immediate: true });

// Store unlisten functions for cleanup
let unlistenFileChanged: (() => void) | null = null;
let unlistenFileTreeChanged: (() => void) | null = null;

// Set up event listeners (these need to be in setup, so we use onMounted)
onMounted(async () => {
  checkGitRepo();
  // File content change listener
  unlistenFileChanged = await listen('file_changed', async (event: any) => {
    const { path } = event.payload;
    console.log('file changed', file.value?.path, path);

    if (file.value?.path === path) {
      try {
        // Reload the file content
        const newContent = await loadFileContent(path);
        const currentContent = file.value?.content || '';

        // Check if content actually changed
        if (newContent !== currentContent) {
          externallyModified.value = true;
        }
      } catch (error) {
        console.error('Failed to reload file:', error);
      }
    }
  });

  // Debounced file tree refresh to avoid excessive updates
  const debouncedFileTreeRefresh = debounce(async () => {
    // Refresh the file tree by reloading the root
    try {
      const newRootFiles = await listFiles('');
      fileSystem.value = newRootFiles;
    } catch (error) {
      console.error('Failed to refresh file tree:', error);
    }
  }, 300);

  // File tree change listener (create/remove)
  unlistenFileTreeChanged = await listen('file_tree_changed', async (_event: any) => {
    debouncedFileTreeRefresh();
  });
});

// Reload file when user explicitly wants to accept external changes
async function reloadFile() {
  if (file.value?.path) {
    try {
      const newContent = await loadFileContent(file.value.path);
      file.value = { ...file.value, content: newContent };
      externallyModified.value = false;
    } catch (error) {
      console.error('Failed to reload file:', error);
    }
  }
}

async function checkGitRepo() {
  try {
    isGitRepo.value = await invoke<boolean>('is_git_repo', { path: props.cwd });
  } catch (error) {
    console.error('Failed to check git repo:', error);
    isGitRepo.value = false;
  }
}

async function showDiff() {
  try {
    const content = await invoke<string>('get_git_diff_all', { 
      basePath: props.cwd 
    });
    diffContent.value = content;
    showDiffView.value = true;
  } catch (error) {
    console.error('Failed to get git diff:', error);
    diffContent.value = "Failed to load diff";
    showDiffView.value = true;
  }
}

function closeDiff() {
  showDiffView.value = false;
  diffContent.value = "";
}

// Cleanup on unmount
onUnmounted(async () => {
  // Unlisten to file change events
  unlistenFileChanged?.();
  unlistenFileTreeChanged?.();

  // Stop watching the directory
  try {
    await invoke('stop_watching', { sessionId: currentSessionId.value });
  } catch (error) {
    console.error('Failed to stop watching:', error);
  }
});

function openTerminal() {
  eventBus.emit('artifact', `terminal::${props.cwd}`);
}

function onSelectionChange(selectionData: { selection?: { start: number; end: number } }) {
  artifactsStore.setContext(artifactKey, {
    file: file.value ? { path: file.value.path } : undefined,
    selection: selectionData.selection
  });
}
</script>

<template>
  <SplitterGroup class="flex-1" direction="horizontal">
    <SplitterPanel :default-size="40">
      <FileTree v-model="fileSystem" :cwd="cwd" :artifact-key="`workspace::${cwd}`" @select="onSelect" />
    </SplitterPanel>
    <SplitterResizeHandle class="w-0.5 splitter-handle" />
    <SplitterPanel>
      <div class="flex flex-col h-full">
        <SplitterGroup direction="vertical" class="flex-1">
          <SplitterPanel class="flex flex-col" :default-size="60">
            <header class="p-1 border-b border-zinc-200 dark:border-slate-800 h-10 flex items-center gap-2">
              <div class="flex-1 flex items-center gap-2">
                <div v-if="showDiffView" class="flex items-center gap-2">
                  <UIcon name="i-lucide-git-compare-arrows" class="w-4 h-4" />
                  <h2 class="text-sm font-medium truncate select-none">Git Diff</h2>
                </div>
                <div v-else-if="externallyModified" class="flex items-center gap-1 text-amber-600" title="File modified externally">
                  <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
                  <span class="text-xs">Modified externally</span>
                  <UButton size="xs" variant="soft" @click="reloadFile">Reload</UButton>
                </div>
                <h2 v-else class="text-sm font-medium truncate select-none">{{ file?.name }}</h2>
              </div>
              <div class="flex items-center gap-1">
                <UTooltip v-if="isGitRepo && !showDiffView" text="Show diff">
                  <UButton size="sm" icon="i-lucide-git-compare-arrows" @click="showDiff" />
                </UTooltip>
                <UTooltip v-if="showDiffView" text="Close diff">
                  <UButton size="sm" icon="i-lucide-x" @click="closeDiff" />
                </UTooltip>
                <UTooltip text="Open terminal">
                  <UButton size="sm" icon="i-lucide-square-terminal" @click="openTerminal" />
                </UTooltip>
              </div>
            </header>
            <KeepAlive :max="10">
              <Editor
                v-if="!showDiffView && file"
                :key="file.path"
                class="flex-1 min-h-0"
                v-model="file.content!"
                :language="(file.name.split('.').pop()?.toLowerCase() || 'py') as 'py' | 'js' | 'ts' | 'tsx' | 'json'"
                :theme="colorMode === 'dark' ? 'dark' : 'light'"
                @selection="onSelectionChange"
              />
            </KeepAlive>
            <DiffViewer
              v-if="showDiffView"
              class="flex-1 min-h-0"
              :diff="diffContent"
              :theme="colorMode === 'dark' ? 'dark' : 'light'"
            />
            <div v-if="!showDiffView && !file"
              class="flex-1 min-h-0 flex flex-col items-center justify-center text-gray-400"
            >
              <UIcon name="i-lucide-file-code" class="w-16 h-16 mb-4 opacity-50" />
              <p class="text-lg">No file selected</p>
              <p class="text-sm mt-1">Select a file to start editing</p>
            </div>
          </SplitterPanel>
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