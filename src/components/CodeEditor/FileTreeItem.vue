<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { confirm } from '@tauri-apps/plugin-dialog';

interface Props {
  icon?: string;
  label?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  rename: [newName: string];
  delete: [];
}>();

const isHovered = ref(false);
const isOpen = ref(false);
const isEditing = ref(false);
const editingValue = ref('');
const inputRef = ref<any>(null);

async function handleDelete() {
  const ok = await confirm(`Are you sure you want to delete "${props.label}"?`, {
    title: 'Delete File',
    kind: 'warning'
  });

  if (ok) {
    emit('delete');
  }
}

function startRename() {
  isEditing.value = true;
  editingValue.value = props.label || '';
  isOpen.value = false;
  nextTick(() => {
    inputRef.value?.inputRef.focus();
    inputRef.value?.inputRef.select();
  });
}

function cancelRename() {
  isEditing.value = false;
  editingValue.value = '';
}

function commitRename() {
  if (editingValue.value && editingValue.value !== props.label) {
    emit('rename', editingValue.value);
  }
  isEditing.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    commitRename();
  } else if (event.key === 'Escape') {
    cancelRename();
  }
}

function onBlur() {
  commitRename();
}

const menuItems = [
  {
    label: 'Rename',
    icon: 'i-lucide-pencil',
    onSelect: startRename
  },
  {
    label: 'Delete',
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: handleDelete
  }
];

function onMouseEnter() {
  if (!isEditing.value) {
    isHovered.value = true;
  }
}

function onMouseLeave() {
  if (!isOpen.value && !isEditing.value) {
    isHovered.value = false;
    isOpen.value = false;
  }
}

watch(isOpen, (open) => {
  if (!open) {
    isHovered.value = false;
  }
});
</script>

<template>
  <div
    class="w-full flex gap-1 items-center group"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <UIcon :name="icon" class="size-5 shrink-0"></UIcon>
    <div v-if="!isEditing" class="text-left truncate flex-1">
      {{ label }}
    </div>
    <UInput
      v-else
      ref="inputRef"
      v-model="editingValue"
      class="flex-1 -my-1"
      size="xs"
      @blur="onBlur"
      @keydown.stop="onKeydown"
      @keyup.stop
      @click.stop
    />
    <UDropdownMenu
      v-if="isHovered && !isEditing"
      :items="menuItems"
      :modal="false"
      v-model:open="isOpen"
    >
      <UButton
        icon="i-lucide-more-vertical"
        size="2xs"
        color="neutral"
        variant="ghost"
        @click.stop
      />
    </UDropdownMenu>
  </div>
</template>
