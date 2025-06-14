<script setup lang="ts">
import { computed, nextTick } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { AnimatePresence } from "motion-v";
import { useTabsStore } from "@/stores/tabs";
import ChatBox from "@/components/ChatBox.vue";
import MessageList from "@/components/MessageList.vue";
import { useChat } from "@/hooks/useChat";
import { getChat } from "@/db";

const route = useRoute();
const id = route.params.id as string;
const initialData = await getChat(id);

const { expanded } = storeToRefs(useTabsStore());

const viewWidth = computed(() =>
  expanded.value ? undefined : Math.min(screen.width / 3, 600),
);

const { status, messages, setMessages } = useChat({ id });

// initialMessages not useful for multiple calls to useChat
nextTick(() => {
  setMessages(initialData?.messages.map((e) => e.data) ?? []);
});

if (initialData) {
  setMessages(initialData.messages.map((e) => e.data));
}

const showMessageList = computed(() => {
  return initialData?.messages.length || status.value != "ready";
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 justify-center">
    <AnimatePresence>
      <MessageList
        v-if="showMessageList"
        :width="viewWidth"
        :messages="messages"
        :status="status"
        key="message-list"
        :initial="initialData ? false : 'hidden'"
        animate="visible"
        exit="hidden"
        :variants="{
          visible: { maxHeight: '100%' },
          hidden: { maxHeight: '0' },
        }"
      />
      <header v-else class="mx-auto text-3xl font-semibold mb-3">
        How can I help you?
      </header>
    </AnimatePresence>
    <div class="px-8 my-4">
      <ChatBox
        :style="{ width: viewWidth ? `${viewWidth}px` : '100%' }"
        :id="id"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
