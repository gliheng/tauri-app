<script setup lang="ts">
import { watch, ref, PropType, inject } from "vue";
import { motion } from "motion-v";
import { UIMessage } from "ai";
import { CHAT_ACTIONS } from "@/constants";
import MessageBubble from "./MessageBubble.vue";
import MessageEdit from "./MessageEdit.vue";

const props = defineProps({
  width: Number,
  messages: {
    type: Array as PropType<UIMessage[]>,
    default: () => [],
  },
  messageGraph: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  status: String,
});

const listRef = ref<HTMLElement | null>(null);
const editingId = ref<string>();

const actions = inject(CHAT_ACTIONS) as any;

// Track if auto-scroll should be enabled (user is near bottom)
const isAutoScrollEnabled = ref(true);
// Threshold in pixels to consider "near bottom"
const BOTTOM_THRESHOLD = 20;

const checkIsNearBottom = (): boolean => {
  const el = listRef.value;
  if (!el) return true;

  const { scrollTop, scrollHeight, clientHeight } = el;
  // Consider near bottom if within threshold pixels of bottom
  return scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD;
};

const handleScroll = () => {
  isAutoScrollEnabled.value = checkIsNearBottom();
};

const scrollToBottom = () => {
  const el = listRef.value;
  if (el) {
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
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
          behavior: "smooth",
        });
      }
    }
  },
  {
    deep: true,
  },
);

</script>

<template>
  <motion.div class="flex-1 flex min-h-0 max-w-full relative">
    <div class="w-full overflow-y-auto overfloww-w-hidden" ref="listRef" @scroll="handleScroll">
      <div class="px-8">
        <div
          class="flex-1 flex flex-col gap-2 min-h-0 mx-auto my-4 max"
          :style="{
            maxWidth: width ? `${width}px` : '100%',
          }"
        >
          <Component
            v-for="message in messages"
            :message="message"
            :is="editingId === message.id ? MessageEdit : MessageBubble"
            :key="message.id"
            :last="message.id === messages[messages.length - 1].id"
            :loading="
              message.id === messages[messages.length - 1].id &&
              (status == 'submitted' || status == 'streaming')
            "
            @start-edit="() => (editingId = message.id)"
            @cancel-edit="() => (editingId = '')"
            @regenerate="actions.regenerate"
          />
          <LoadingText v-if="status == 'submitted'" />
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

<style lang="scss" scoped></style>
