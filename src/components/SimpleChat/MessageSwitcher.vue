<script setup lang="ts">
import { inject, computed } from "vue";
import { MESSAGE_GRAPH } from "@/constants";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const { graph, select } = inject(MESSAGE_GRAPH)!;
const node = computed(() => graph.value[props.id]);
const i = computed(() => node.value?.siblingIndex);
const count = computed(() => node.value?.siblingCount);

function showPrev() {
  select(node.value.parent, i.value - 1);
}

function showNext() {
  select(node.value.parent, i.value + 1);
}
</script>

<template>
  <div class="flex flex-row items-center gap-1" v-if="node && count > 1">
    <UButton
      class="px-0"
      color="neutral"
      variant="ghost"
      trailing-icon="i-lucide-chevron-left"
      :disabled="i <= 0"
      @click="showPrev"
    />
    {{ i + 1 }} / {{ count }}
    <UButton
      class="px-0"
      color="neutral"
      variant="ghost"
      :disabled="i >= count - 1"
      @click="showNext"
      trailing-icon="i-lucide-chevron-right"
    />
  </div>
</template>
