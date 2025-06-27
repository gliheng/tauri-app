<script setup lang="ts">
import { computed, watch, ref, PropType } from "vue";
import { motion } from "motion-v";
import { Message } from "ai";
import MessageBubble from "./MessageBubble.vue";
import MessageEdit from "./MessageEdit.vue";

const props = defineProps({
  width: Number,
  messages: {
    type: Array as PropType<Message[]>,
    default: () => [],
  },
  messageGraph: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  status: String,
});

const displayMessages = computed(() => {
  const list: Message[] = [...props.messages];
  return list;
});

const listRef = ref<HTMLElement | null>(null);
const editingId = ref<string>();

// Scroll to bottom when new message is added
watch(
  () => props.messages,
  () => {
    listRef.value?.lastElementChild?.scrollIntoView(false, {
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
      <Component
        v-for="message in displayMessages"
        v-bind="message"
        :is="editingId === message.id ? MessageEdit : MessageBubble"
        :key="message.id"
        :last="message.id === displayMessages[displayMessages.length - 1].id"
        :loading="
          message.id === displayMessages[displayMessages.length - 1].id &&
          (status == 'submitted' || status == 'streaming')
        "
        @start-edit="() => (editingId = message.id)"
        @cancel-edit="() => (editingId = '')"
      />
      <MessageBubble
        v-if="status == 'submitted'"
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
