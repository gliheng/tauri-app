<script setup lang="ts">
import { ref, watch } from 'vue';
import { confirm } from '@tauri-apps/plugin-dialog';

interface Props {
  icon?: string;
  label?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  rename: [];
  delete: [];
}>();

const isHovered = ref(false);
const isOpen = ref(false);

async function handleDelete() {
  const ok = await confirm(`Are you sure you want to delete "${props.label}"?`, {
    title: 'Delete File',
    kind: 'warning'
  });
  
  if (ok) {
    emit('delete');
  }
}

const menuItems = [
  {
    label: 'Rename',
    icon: 'i-lucide-pencil',
    onSelect: () => emit('rename')
  },
  {
    label: 'Delete',
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: handleDelete
  }
];

function onMouseEnter() {
  isHovered.value = true;
}

function onMouseLeave() {
  if (!isOpen.value) {
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
    <UIcon :name="icon" class="size-5"></UIcon>
    <div class="text-left truncate flex-1">
      {{ label }}
    </div>
    <UDropdownMenu
      v-if="isHovered"
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
