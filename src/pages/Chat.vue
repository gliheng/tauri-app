<script setup lang="ts">
import { provide, computed, ref, reactive } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { AnimatePresence } from "motion-v";
import { omit } from "lodash-es";
import { useTabsStore } from "@/stores/tabs";
import ChatBox from "@/components/ChatBox.vue";
import MessageList from "@/components/MessageList.vue";
import { useChat } from "@/hooks/useChat";
import { ChatMessage, getChat, getMessages } from "@/db";
import { CHAT_ACTIONS, MESSAGE_GRAPH } from "@/constants";

const route = useRoute();
const chatId = route.params.id as string;
const initialData = await getChat(chatId);

const { expanded } = storeToRefs(useTabsStore());
const messageGraph = ref<Record<string, any>>({});
const pathSelection: Record<string, number> = {};

function addMessageToGraph(id: string, parent?: string) {
  const graph = messageGraph.value;
  if (!(id in graph)) {
    graph[id] = {
      children: [],
      siblingCount: 1,
      siblingIndex: 0,
    };
  }

  if (parent) {
    const parentNode = graph[parent];
    parentNode.children.push(id);
    const totalSiblings = parentNode.children.length;
    parentNode.children.forEach((node, i) => {
      const siblingNode = graph[node];
      if (siblingNode) {
        siblingNode.siblingCount = totalSiblings;
        siblingNode.siblingIndex = i;
      }
    });
  }
}

const viewWidth = computed(() =>
  expanded.value ? undefined : Math.min(screen.width / 3, 600),
);

const {
  status,
  messages,
  setMessages,
  reload,
  append,
  input,
  stop,
  handleSubmit,
} = useChat({
  id: chatId,
  initialMessages: initialData?.messages.map((e) => e.data) ?? [],
  onFinish(message) {
    const len = messages.value.length;
    const userMessage = messages.value[len - 2];
    const prevAssistantMessage = messages.value[len - 3];
    addMessageToGraph(userMessage.id, prevAssistantMessage?.id);
    addMessageToGraph(message.id, userMessage.id);
  },
});

function loadMessages(messages: ChatMessage[] = []) {
  console.info("loadMessages", messages);
  messageGraph.value = {};
  for (const msg of messages) {
    messageGraph.value[msg.id] = omit(msg, ["data", "chatId", "id"]);
  }
  setMessages(messages.map((e) => e.data) ?? []);
}

loadMessages(initialData?.messages);

const showMessageList = computed(() => {
  return messages.value.length || status.value != "ready";
});

provide(CHAT_ACTIONS, { reload, stop, append, input, status, handleSubmit });
provide(MESSAGE_GRAPH, {
  graph: messageGraph,
  async select(id: string, index: number) {
    pathSelection[id] = index;
    const messages = await getMessages(chatId, pathSelection);
    loadMessages(messages);
    console.log("select", id, index);
  },
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 justify-center relative">
    <header class="absolute top-2 right-2">
      <UPopover>
        <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="subtle" />
        <template #content>
          <div class="p-4 w-60 bg-elevated">
            <label>
              <span class="block mb-2">Temperature</span>
              <USlider :step="0.01" :min="0" :max="1" :default-value="0.5" block />
            </label>
          </div>
        </template>
      </UPopover>
    </header>
    <AnimatePresence>
      <MessageList
        v-if="showMessageList"
        key="message-list"
        animate="visible"
        :width="viewWidth"
        :messages="messages"
        :status="status"
        :initial="initialData ? false : 'hidden'"
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
        :id="chatId"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
