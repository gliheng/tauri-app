<script setup lang="ts">
import { provide, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { AnimatePresence } from "motion-v";
import { omit } from "lodash-es";
import ChatBox from "@/components/ChatBox.vue";
import MessageList from "@/components/MessageList.vue";
import { useChat } from "@/hooks/useChat";
import { ChatMessage, getChat, getMessages } from "@/db";
import { CHAT_ACTIONS, MESSAGE_GRAPH, ROOT_NODE_ID } from "@/constants";

const route = useRoute();
const chatId = route.params.id as string;
const initialData = await getChat(chatId);

const expanded = ref(false);
const messageGraph = ref<Record<string, any>>({});
const pathSelection: Record<string, number> = {};

function addMessageToGraph(id: string, parent?: string) {
  const graph = messageGraph.value;
  if (!(id in graph)) {
    graph[id] = {
      children: [],
      parent,
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
  } else {
    const kv = Object.entries(graph).find(
      ([msgId, msg]) => !msg.parent && msgId != id,
    );
    if (kv) {
      const [oldId, oldNode] = kv;
      delete graph[oldId];
      const node = graph[id];
      node.siblingCount = oldNode.siblingCount + 1;
      node.siblingIndex = oldNode.siblingIndex + 1;
    }
  }
}

const viewWidth = computed(() =>
  expanded.value ? undefined : Math.min(screen.width / 3, 600),
);

const {
  error,
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
    // Add user message to graph
    const prevAssistantMessage = messages.value[len - 3];
    addMessageToGraph(userMessage.id, prevAssistantMessage?.id);
    // Add assistant message to graph
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

provide(CHAT_ACTIONS, {
  messages,
  reload,
  stop,
  append,
  input,
  status,
  setMessages,
  handleSubmit,
});

provide(MESSAGE_GRAPH, {
  graph: messageGraph,
  // switch node path, id is the parent id, index is the child index
  async select(id: string, index: number) {
    console.info("select", id, index);
    pathSelection[id ?? ROOT_NODE_ID] = index;
    const messages = await getMessages(chatId, pathSelection);
    loadMessages(messages);
  },
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 justify-center relative">
    <header class="absolute top-2 right-2 z-10 flex flex-row gap-2">
      <UButton
        icon="i-mdi-arrow-expand-horizontal"
        color="neutral"
        variant="subtle"
        @click="expanded = !expanded"
      />
      <UPopover>
        <UButton
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="subtle"
        />
        <template #content>
          <div class="p-4 w-60 bg-elevated space-y-4">
            <label class="block">
              <span class="block mb-2">Temperature</span>
              <USlider
                :step="0.01"
                :min="0"
                :max="1"
                :default-value="0.5"
                tooltip
              />
            </label>
            <label class="block">
              <span class="block mb-2">Context size</span>
              <USlider
                :step="1"
                :min="0"
                :max="20"
                :default-value="5"
                tooltip
              />
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
        v-model="input"
        :status="status"
        :style="{ width: viewWidth ? `${viewWidth}px` : '100%' }"
        @submit="(data) => handleSubmit(undefined, data)"
        @stop="stop"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
