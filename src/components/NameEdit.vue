<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";

const nameModel = defineModel('name', { type: String });

const editingName = ref(false);
const agentName = ref("");
const input = useTemplateRef("input");

function startEdit() {
  editingName.value = true;
  agentName.value = nameModel.value!;
  nextTick(() => {
    const el = input.value?.inputRef;
    el?.focus();
    el?.select();
  });
}

function saveEdit() {
  nameModel.value = agentName.value;
  editingName.value = false;
}

function cancelEdit() {
  editingName.value = false;
}
</script>

<template>
  <div class="flex flex-row gap-2 items-center flex-1">
    <h1 v-if="!editingName" class="flex-1 text-lg" @click="startEdit">
      {{ nameModel }}
    </h1>
    <template v-else>
      <UInput
        ref="input"
        v-model="agentName"
        class="flex-1"
        @keydown.enter="saveEdit"
      />
      <UButton
        icon="i-lucide-check"
        variant="outline"
        :disabled="!agentName"
        @click="saveEdit"
      />
      <UButton icon="i-lucide-x" variant="outline" @click="cancelEdit" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
</style>