<script setup lang="ts">
import { computed, PropType, inject } from "vue";
import { tv } from "tailwind-variants";
import { Message } from "ai";
import { CHAT_ACTIONS } from "@/constants";
import MarkdownText from "./MarkdownText.vue";
import FileImage from "./FileImage.vue";
import MessageSwitcher from "./MessageSwitcher.vue";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  parts: Array as PropType<Message["parts"][]>,
  experimental_attachments: Array as PropType<
    Message["experimental_attachments"]
  >,
  // createdAt: Date,
  last: {
    type: Boolean,
    default: false,
  },
  loading: Boolean,
});

const bubbleStyle = tv({
  base: "w-fit max-w-full flex flex-col",
  variants: {
    role: {
      user: "self-end items-end",
      assistant: "self-start items-start",
    },
  },
});

const displayParts = computed(() => props.parts ?? []);

function copyText() {
  navigator.clipboard.writeText(props.content);
}

const { reload } = inject(CHAT_ACTIONS);
</script>

<template>
  <section :class="bubbleStyle({ role })">
    <div v-if="role == 'assistant'">
      <h1 class="flex items-center gap-2 mb-2">
        <UAvatar icon="i-mdi-robot" size="md" />
        Assistant
      </h1>
      <div :class="{ 'animate-bounce': loading }">
        <div
          v-for="(part, i) in displayParts"
          :key="i"
          class="mb-2 empty:hidden"
        >
          <div v-if="part.type == 'text'">
            <MarkdownText :markdown="part.text" />
          </div>
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
                base: i === displayParts.length - 1 ? 'animate-pulse' : '',
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            >
            </UButton>
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
    <div v-else>
      <p class="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
        {{ content }}
      </p>
    </div>
    <FileImage
      v-for="(attachment, index) of experimental_attachments"
      class="max-w-full mt-2"
      :key="index"
      :url="attachment.url"
    />
    <div class="flex flex-row items-center gap-1 mt-2">
      <MessageSwitcher :id="id" />
      <UTooltip text="Copy text">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-copy"
          @click="copyText"
        />
      </UTooltip>
      <UTooltip v-if="last && role == 'assistant'" text="Reload">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-refresh-cw"
          @click="reload"
        />
      </UTooltip>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
