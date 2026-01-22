<script setup lang="ts">
import { ref, watch, PropType } from "vue";
import Scrollbar from "@/components/Scrollbar.vue";
import MessageBubble from "./MessageBubble.vue";

const props = defineProps({
  messages: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  status: String,
  width: Number,
});

const listRef = ref<InstanceType<typeof Scrollbar> | null>(null);

// Track if auto-scroll should be enabled (user is near bottom)
const isAutoScrollEnabled = ref(true);
// Threshold in pixels to consider "near bottom"
const BOTTOM_THRESHOLD = 100;

const checkIsNearBottom = (): boolean => {
  const scroller = (listRef.value as any)?.scroller;
  if (!scroller) return true;

  const { maxScrollY, scrollTop } = scroller;
  // Consider near bottom if within threshold pixels of bottom
  return maxScrollY - scrollTop <= BOTTOM_THRESHOLD;
};

const handleScroll = () => {
  isAutoScrollEnabled.value = checkIsNearBottom();
};

// Scroll to bottom when new message is added (only if auto-scroll is enabled)
watch(
  () => props.messages,
  () => {
    if (isAutoScrollEnabled.value) {
      const scroller = (listRef.value as any).scroller;
      if (scroller) {
        scroller.scrollToBottom();
      }
    }
  },
);
</script>

<template>
  <Scrollbar class="w-full" ref="listRef" @scroll="handleScroll">
    <div
      class="px-8 flex-1 flex flex-col gap-2 min-h-0 mx-auto my-4"
      :style="{
        maxWidth: width ? `${width}px` : '100%',
      }"
    >
      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        v-bind="message"
      />
      <LoadingText v-if="status == 'submitted' || status == 'streaming'" />
    </div>
  </Scrollbar>
</template>

<style lang="scss" scoped>
</style>