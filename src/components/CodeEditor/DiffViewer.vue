<script setup lang="ts">
import { ref, computed } from 'vue'
import DiffFile from './DiffFile.vue'

interface Props {
  diff: string
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
})

const viewMode = ref<'unified' | 'split'>('unified')

interface FileDiff {
  filePath: string
  oldPath?: string
  newPath?: string
  original: string
  modified: string
  isBinary: boolean
  isNew: boolean
  isDeleted: boolean
}

const diffContent = computed(() => {
  if (!props.diff || props.diff === 'Failed to load diff') {
    return ''
  }
  return props.diff
})

function parseDiffToFiles(diff: string): FileDiff[] {
  const lines = diff.split('\n')
  const files: FileDiff[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('diff --git')) {
      // Extract file paths
      const match = line.match(/diff --git a\/(\S+) b\/(\S+)/)
      const filePath = match ? match[2] : 'unknown'
      const oldPath = match ? match[1] : undefined
      const newPath = match ? match[2] : undefined

      const original: string[] = []
      const modified: string[] = []
      let isBinary = false
      let isNew = false
      let isDeleted = false

      i++

      // Parse file headers
      while (i < lines.length && !lines[i].startsWith('@@')) {
        const headerLine = lines[i]
        if (headerLine.includes('Binary file')) {
          isBinary = true
        }
        if (headerLine.startsWith('new file')) {
          isNew = true
        }
        if (headerLine.startsWith('deleted file')) {
          isDeleted = true
        }
        i++
      }

      // Parse hunks
      if (i < lines.length && lines[i].startsWith('@@')) {
        i++ // Skip hunk header
        // Process hunk content
        while (i < lines.length && !lines[i].startsWith('diff') && !lines[i].startsWith('@@')) {
          const hunkLine = lines[i]
          if (hunkLine.startsWith('-')) {
            original.push(hunkLine.slice(1))
          } else if (hunkLine.startsWith('+')) {
            modified.push(hunkLine.slice(1))
          } else if (hunkLine.startsWith(' ')) {
            original.push(hunkLine.slice(1))
            modified.push(hunkLine.slice(1))
          }
          i++
        }
      }

      files.push({
        filePath,
        oldPath,
        newPath,
        original: original.join('\n'),
        modified: modified.join('\n'),
        isBinary,
        isNew,
        isDeleted,
      })
    } else {
      i++
    }
  }

  return files
}

const fileDiffs = computed(() => {
  if (!diffContent.value) return []
  return parseDiffToFiles(diffContent.value)
})

const bgColor = computed(() => props.theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white')
const textColor = computed(() => props.theme === 'dark' ? 'text-[#d4d4d4]' : 'text-[#24292e]')
const borderColor = computed(() => props.theme === 'dark' ? 'border-[#30363d]' : 'border-[#e5e5e5]')

function toggleViewMode() {
  viewMode.value = viewMode.value === 'unified' ? 'split' : 'unified'
}
</script>

<template>
  <div :class="['h-full w-full overflow-auto', bgColor]">
    <!-- Toggle button and file count -->
    <div
      v-if="diffContent && fileDiffs.length > 0"
      :class="['sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b', bgColor, borderColor]"
    >
      <div :class="['text-[13px] font-medium', textColor]">
        {{ fileDiffs.length }} {{ fileDiffs.length === 1 ? 'file' : 'files' }} changed
      </div>
      <UButton
        :icon="viewMode === 'unified' ? 'i-lucide-columns' : 'i-lucide-file-text'"
        size="xs"
        variant="ghost"
        @click="toggleViewMode"
      >
        {{ viewMode === 'unified' ? 'Split view' : 'Unified view' }}
      </UButton>
    </div>

    <!-- Files in collapsible sections -->
    <div v-if="diffContent && fileDiffs.length > 0" class="p-2">
      <UCollapsible v-for="(fileDiff, index) in fileDiffs" :key="index" :default-open="fileDiffs.length <= 20">
        <div class="flex items-center justify-between px-3 py-2 cursor-pointer select-none">
          <div class="flex items-center gap-2">
            <UIcon
              :name="fileDiff.isDeleted ? 'i-lucide-file-minus' : fileDiff.isNew ? 'i-lucide-file-plus' : 'i-lucide-file-edit'"
              :class="[
                'w-4 h-4 flex-shrink-0',
                fileDiff.isDeleted ? 'text-red-400' : fileDiff.isNew ? 'text-green-400' : 'text-blue-400'
              ]"
            />
            <span :class="['font-mono text-[13px]', textColor]">{{ fileDiff.filePath }}</span>
            <span
              v-if="fileDiff.isBinary"
              class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-500/20 text-gray-500"
            >
              Binary
            </span>
          </div>
        </div>
        <template #content>
          <div :class="['border-t', borderColor]">
            <DiffFile
              :original="fileDiff.original"
              :modified="fileDiff.modified"
              :view-mode="viewMode"
              :theme="props.theme"
              :is-binary="fileDiff.isBinary"
              :is-new="fileDiff.isNew"
              :is-deleted="fileDiff.isDeleted"
            />
          </div>
        </template>
      </UCollapsible>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="h-full flex flex-col items-center justify-center text-gray-500"
    >
      <UIcon name="i-lucide-git-compare-arrows" class="w-16 h-16 mb-4 opacity-50" />
      <p class="text-lg">No changes</p>
      <p class="text-sm mt-1">Working directory is clean</p>
    </div>
  </div>
</template>
