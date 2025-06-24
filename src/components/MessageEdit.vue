<script setup lang="ts">
const emit = defineEmits(["cancel-edit"]);
function saveEdit() {
  // Implement save logic here
}
</script>
<template>
  <section class="w-full max-w-full flex flex-col self-end items-end gap-2">
    <UTextarea class="w-full" />
    <div class="flex gap-2 justify-end">
      <UButton color="neutral" variant="subtle" @click="emit('cancel-edit')"
        >Cancel</UButton
      >
      <UButton @click="saveEdit">Save</UButton>
    </div>
  </section>
</template>
