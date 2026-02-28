<script setup lang="ts">
const emit = defineEmits<{
  close: [type: "note" | "chart"];
}>();

function createNote() {
  emit('close', 'note');
}

function createChart() {
  emit('close', 'chart');
}
</script>

<template>
  <UModal title="Create New Document" description="Choose the type of document you want to create">
    <template #content>
      <div class="size-full p-6 flex flex-col justify-center gap-6">
        <h1 class="text-2xl font-bold text-center">Create New Document</h1>
        <div class="flex gap-4">
          <button
            class="flex-1 h-48 text-2xl flex flex-col gap-4 items-center justify-center rounded-lg border border-accented bg-muted cursor-pointer"
            @click="createNote"
          >
            <UIcon name="i-lucide-notebook-text" class="text-4xl" />
            <span>Note</span>
          </button>
          <button
            class="flex-1 h-48 text-2xl flex flex-col gap-4 items-center justify-center rounded-lg border border-accented bg-muted cursor-pointer"
            @click="createChart"
          >
            <UIcon name="i-lucide-git-compare" class="text-4xl" />
            <span>Chart</span>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
