<script setup lang="ts">
import { PropType } from "vue";
import { Message } from "ai";
import MessageBubble from "@/components/MessageBubble.vue";
import Scrollbar from "@/components/Scrollbar.vue";

const props = defineProps({
  messages: {
    type: Array as PropType<Message[]>,
    default: () => [],
  },
});
</script>

<template>
  <Scrollbar class="w-full" ref="listRef">
    <div
      class="px-8 flex-1 flex flex-col gap-2 min-h-0 mx-auto my-4 max"
    >
      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        v-bind="message"
      />
    </div>
  </Scrollbar>
</template>

<style lang="scss" scoped>
</style>