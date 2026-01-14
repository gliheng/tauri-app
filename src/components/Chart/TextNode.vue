<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { NodeResizer } from '@vue-flow/node-resizer';

const props = defineProps<{
  id: string;
  data: { label: string; content: string };
  selected: boolean;
}>();
</script>

<template>
  <NodeResizer :min-width="100" :min-height="30" />
  <div
    class="chart-node"
    :class="{ selected }"
  >
    <Handle id="top" :position="Position.Top" />
    <Handle id="bottom" :position="Position.Bottom" />
    <Handle id="left" :position="Position.Left" />
    <Handle id="right" :position="Position.Right" />
    <UTextarea
      v-model="data.content"
      placeholder="Type here..."
      :rows="3"
    />
  </div>
</template>

<style scoped>

</style>
