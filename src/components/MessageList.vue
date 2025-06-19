<script setup lang="ts">
import { computed, watch, ref, PropType } from "vue";
import { motion } from "motion-v";
import { Message } from "ai";
import MessageBubble from "./MessageBubble.vue";

const props = defineProps({
  width: Number,
  messages: {
    type: Array as PropType<Message[]>,
    default: () => [],
  },
  status: String,
});

const displayMessages = computed(() => {
  const list: Message[] = [...props.messages];
  return list;
});

const listRef = ref<HTMLElement | null>(null);

watch(
  () => props.messages,
  () => {
    listRef.value?.scrollIntoView(false, {
      behavior: "smooth",
    });
  },
);
</script>

<template>
  <motion.div class="flex-1 flex overflow-y-auto px-8">
    <div
      class="flex-1 flex flex-col gap-2 min-h-0 mx-auto my-4 max"
      :style="{
        maxWidth: width ? `${width}px` : '100%',
      }"
      ref="listRef"
    >
      <MessageBubble
        v-for="message in displayMessages"
        :key="message.id"
        v-bind="message"
        :last="message.id === displayMessages[displayMessages.length - 1].id"
      />
      <MessageBubble
        v-if="props.status == 'submitted'"
        key="thinking"
        id="thinking"
        role="assistant"
        content="Thinking ..."
        loading
      />
    </div>
  </motion.div>
</template>

<style lang="scss" scoped></style>
