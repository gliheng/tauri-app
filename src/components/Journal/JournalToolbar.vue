<script setup lang="ts">
import { computed } from "vue";
import moment from "moment";

const props = defineProps<{
  currentDate: Date;
}>();

const emit = defineEmits<{
  previous: [];
  next: [];
  today: [];
}>();

const dateDisplay = computed(() => {
  return moment(props.currentDate).format('MMM D, YYYY');
});
</script>

<template>
  <div class="flex items-center justify-between py-3 px-6 border-b border-white/10">
    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="emit('previous')"
      />
      <UButton
        :label="dateDisplay"
        variant="subtle"
        color="neutral"
        size="sm"
      />
      <UButton
        icon="i-lucide-chevron-right"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="emit('next')"
      />
    </div>
    
    <div class="flex items-center gap-2">
      <UButton
        label="Today"
        variant="outline"
        color="primary"
        size="sm"
        @click="emit('today')"
      />
    </div>
  </div>
</template>
