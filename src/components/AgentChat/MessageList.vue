<script setup lang="ts">
import { ref, watch, PropType } from "vue";
import { motion } from "motion-v";
import MessageBubble from "./MessageBubble.vue";

const props = defineProps({
  messages: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  status: String,
  width: Number,
});

const listRef = ref<HTMLDivElement | null>(null);

// Track if auto-scroll should be enabled (user is near bottom)
const isAutoScrollEnabled = ref(true);
// Threshold in pixels to consider "near bottom"
const BOTTOM_THRESHOLD = 20;

const checkIsNearBottom = (): boolean => {
  const element = listRef.value;
  if (!element) return true;

  const { scrollTop, scrollHeight, clientHeight } = element;
  // Consider near bottom if within threshold pixels of bottom
  return scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD;
};

const handleScroll = () => {
  if (props.status !== "streaming") {
    isAutoScrollEnabled.value = checkIsNearBottom();
  }
};

const scrollToBottom = () => {
  const el = listRef.value;
  if (el) {
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
    isAutoScrollEnabled.value = true;
  }
};

// Scroll to bottom when new message is added (only if auto-scroll is enabled)
watch(
  () => props.messages,
  () => {
    if (isAutoScrollEnabled.value) {
      const el = listRef.value;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: props.status === "streaming" ? "instant" : "smooth",
        });
      }
    }
  },
  {
    deep: true,
    flush: "post",
  },
);
</script>

<template>
  <motion.div class="flex-1 flex min-h-0 max-w-full relative">
    <div
      class="w-full overflow-y-auto overflow-x-hidden"
      ref="listRef"
      @scroll="handleScroll"
    >
      <div class="px-8">
        <div
          class="flex-1 flex flex-col gap-2 min-h-0 mx-auto my-4"
          :style="{
            maxWidth: width ? `${width}px` : '100%',
          }"
        >
          <MessageBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
          />
          <LoadingText v-if="status == 'submitted' || status == 'streaming'" />
        </div>
      </div>
    </div>
    <UButton
      v-if="!isAutoScrollEnabled"
      icon="i-heroicons-arrow-down"
      size="sm"
      color="gray"
      variant="soft"
      class="absolute bottom-4 right-4 z-10"
      @click="scrollToBottom"
    />
  </motion.div>
</template>

<style lang="scss" scoped>
</style>