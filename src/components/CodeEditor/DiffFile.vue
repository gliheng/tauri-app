<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { MergeView } from '@codemirror/merge'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { unifiedMergeView } from '@codemirror/merge'

interface Props {
  original: string
  modified: string
  viewMode: 'unified' | 'split'
  theme: 'light' | 'dark'
  isBinary?: boolean
  isNew?: boolean
  isDeleted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isBinary: false,
  isNew: false,
  isDeleted: false,
})

const editorView = ref<EditorView | MergeView | null>(null)
const editorContainer = ref<HTMLElement>()

function initCurrentView() {
  if (!editorContainer.value) return

  // Handle special cases
  if (props.isBinary) {
    return
  }

  if (props.viewMode === 'unified') {
    initUnifiedView()
  } else {
    initSplitView()
  }
}

function initUnifiedView() {
  if (!editorContainer.value) return

  const original = props.isDeleted ? props.original : props.original
  const modified = props.isNew ? props.modified : props.modified

  editorView.value = new EditorView({
    parent: editorContainer.value,
    doc: modified,
    extensions: [
      basicSetup,
      unifiedMergeView({ original }),
      EditorView.theme({
        '&': {
          backgroundColor: props.theme === 'dark' ? '#1e1e1e' : '#ffffff',
          color: props.theme === 'dark' ? '#d4d4d4' : '#24292e',
        },
        '.cm-scroller': {
          fontFamily: 'Menlo, Monaco, "Ubuntu Mono", "Courier New", monospace',
          fontSize: '13px',
        },
        '.cm-diff-deleted': {
          backgroundColor: 'rgba(248, 81, 73, 0.15) !important',
        },
        '.cm-diff-added': {
          backgroundColor: 'rgba(46, 160, 67, 0.15) !important',
        }
      }),
      EditorState.readOnly.of(true)
    ]
  })
}

function initSplitView() {
  if (!editorContainer.value) return

  const original = props.isDeleted ? props.original : props.isNew ? '' : props.original
  const modified = props.isDeleted ? '' : props.modified

  editorView.value = new MergeView({
    a: {
      doc: original,
      extensions: [
        basicSetup,
        EditorView.theme({
          '&': {
            backgroundColor: props.theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: props.theme === 'dark' ? '#d4d4d4' : '#24292e',
          },
          '.cm-scroller': {
            fontFamily: 'Menlo, Monaco, "Ubuntu Mono", "Courier New", monospace',
            fontSize: '13px',
          }
        }),
        EditorState.readOnly.of(true)
      ]
    },
    b: {
      doc: modified,
      extensions: [
        basicSetup,
        EditorView.theme({
          '&': {
            backgroundColor: props.theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: props.theme === 'dark' ? '#d4d4d4' : '#24292e',
          },
          '.cm-scroller': {
            fontFamily: 'Menlo, Monaco, "Ubuntu Mono", "Courier New", monospace',
            fontSize: '13px',
          }
        }),
        EditorState.readOnly.of(true)
      ]
    },
    parent: editorContainer.value,
    revertControls: 'a-to-b'
  })
}

function cleanupView() {
  if (editorView.value) {
    editorView.value.destroy()
    editorView.value = null
  }
}

watch([() => props.viewMode, () => props.theme], () => {
  cleanupView()
  nextTick(() => {
    initCurrentView()
  })
})

onMounted(() => {
  initCurrentView()
})

onUnmounted(() => {
  cleanupView()
})
</script>

<template>
  <div class="min-h-[100px]">
    <!-- Binary file message -->
    <div
      v-if="isBinary"
      class="flex flex-col items-center justify-center p-8 text-gray-500"
    >
      <UIcon name="i-lucide-file-lock" class="w-12 h-12 mb-2 opacity-50" />
      <p class="text-sm">Binary file not shown</p>
    </div>

    <!-- Empty file message -->
    <div
      v-else-if="isNew && !original"
      class="flex flex-col items-center justify-center p-8 text-gray-500"
    >
      <UIcon name="i-lucide-file-plus" class="w-12 h-12 mb-2 opacity-50 text-green-400" />
      <p class="text-sm">New file</p>
    </div>

    <div
      v-else-if="isDeleted && !modified"
      class="flex flex-col items-center justify-center p-8 text-gray-500"
    >
      <UIcon name="i-lucide-file-minus" class="w-12 h-12 mb-2 opacity-50 text-red-400" />
      <p class="text-sm">Deleted file</p>
    </div>

    <!-- CodeMirror container -->
    <div
      v-else
      ref="editorContainer"
      class="h-full overflow-hidden"
    />
  </div>
</template>

<style scoped>
:deep(.cm-merge-pane) {
  border: none;
}

:deep(.cm-diff-deleted) {
  background-color: rgba(248, 81, 73, 0.15) !important;
}

:deep(.cm-diff-added) {
  background-color: rgba(46, 160, 67, 0.15) !important;
}
</style>
