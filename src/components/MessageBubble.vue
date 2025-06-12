<script setup lang="ts">
import { computed, PropType } from "vue";
import { tv } from "tailwind-variants";
import { Message } from "ai";
import MarkdownText from "./MarkdownText.vue";

const props = defineProps({
  role: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  parts: Array as PropType<Message["parts"][]>,
  createdAt: Date,
});

const bubbleStyle = tv({
  base: "w-fit p-2 max-w-full",
  variants: {
    role: {
      user: "self-end rounded-md bg-gray-100 dark:bg-gray-800",
      assistant: "self-start",
    },
  },
});

const displayParts = computed(() => props.parts ?? []);
</script>

<template>
  <div :class="bubbleStyle({ role })">
    <div v-if="role == 'assistant'">
      <h1 class="flex items-center gap-2 mb-2">
        <UAvatar icon="i-mdi-robot" size="md" />
        Assistant
      </h1>
      <div>
        <div
          v-for="(part, i) in displayParts"
          :key="i"
          class="mb-2 empty:hidden"
        >
          <MarkdownText v-if="part.type == 'text'" :markdown="part.text" />
          <UCollapsible
            v-else-if="part.type == 'reasoning'"
            class="flex flex-col gap-2"
            :unmount-on-hide="false"
          >
            <UButton
              class="self-start group"
              label="Show Thinking"
              color="neutral"
              variant="subtle"
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            />
            <template #content>
              <MarkdownText class="text-zinc-400" :markdown="part.reasoning" />
            </template>
          </UCollapsible>
        </div>
        <div
          v-if="content && displayParts.length == 0"
          class="mb-2 empty:hidden"
        >
          <MarkdownText :markdown="content" />
        </div>
      </div>
    </div>
    <div v-else>{{ content }}</div>
  </div>
</template>

<style lang="scss" scoped></style>
