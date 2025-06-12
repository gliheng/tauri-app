<script setup lang="ts">
import { modelList } from "../llm/models";

const model = defineModel("model", { type: Object });
</script>

<template>
  <USelectMenu
    v-model="model"
    color="primary"
    variant="soft"
    trailing-icon="i-lucide-arrow-down"
    :items="modelList"
    class="w-36"
  />
</template>

<style lang="scss" scoped></style>
