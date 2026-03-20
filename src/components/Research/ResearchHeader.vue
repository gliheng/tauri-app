<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  resourceCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits<{
  "update:title": [value: string];
  "update:icon": [value: string];
}>();

function handleIconUpdate(value: string | undefined) {
  if (value) emit("update:icon", value);
}

function handleTitleUpdate(value: string | undefined) {
  if (value) emit("update:title", value);
}
</script>

<template>
  <div class="border-b border-white/10 px-6 py-4">
    <div class="flex flex-row gap-4 items-center">
      <div class="min-w-0 flex-1">
        <hgroup class="flex flex-row items-center gap-3">
          <IconEdit :icon="icon" @update:icon="handleIconUpdate" />
          <NameEdit :name="title" @update:name="handleTitleUpdate" />
        </hgroup>
        <p class="mt-2 text-sm text-muted">
          Add sources to this topic and chat with AI about them.
        </p>
      </div>
      <slot />
    </div>
  </div>
</template>
