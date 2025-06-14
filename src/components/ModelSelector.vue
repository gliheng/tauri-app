<script setup lang="ts">
import { modelList } from "../llm/models";

const model = defineModel("model", { type: Object });
</script>

<template>
  <USelectMenu
    v-model="model"
    color="primary"
    variant="soft"
    trailing-icon="i-lucide-chevrons-up-down"
    :items="modelList"
    class="w-36"
    :ui="{
      base: 'bg-primary/10 hover:bg-primary/15 text-primary-500 focus-visible:bg-primary/15',
      trailingIcon: 'text-primary-500',
    }"
  />
</template>

<style lang="scss" scoped></style>
