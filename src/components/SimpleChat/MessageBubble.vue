<script setup lang="ts">
import { computed, PropType } from "vue";
import { tv } from "tailwind-variants";
import { Message } from "ai";
import MarkdownText from "@/components/MarkdownText.vue";
import FileImage from "@/components/FileImage.vue";
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

const emit = defineEmits(["start-edit", "reload"]);

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
</script>

<template>
  <section :class="bubbleStyle({ role })">
    <template v-if="role == 'assistant'">
      <h1 class="flex items-center gap-2 mb-2">
        <UAvatar
          :class="{ 'animate-bounce': loading }"
          icon="i-lucide-bot"
          size="md"
        />
        Assistant
      </h1>
      <div class="w-full">
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
              leading-icon="i-lucide-brain"
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
          <UCollapsible
            v-else-if="part.type == 'tool-invocation'"
            class="flex flex-col gap-2"
            :unmount-on-hide="false"
          >
            <UButton
              class="self-start group"
              :label="`Tool: ${(part as any).toolInvocation?.toolName}`"
              color="neutral"
              variant="subtle"
              leading-icon="i-lucide-terminal"
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                base: i === displayParts.length - 1 ? 'animate-pulse' : '',
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            >
            </UButton>
            <template #content>
              <div class="flex flex-col gap-3 text-sm">
                <div v-if="(part as any).toolInvocation?.args" class="flex flex-col gap-1">
                  <span class="font-semibold">Arguments:</span>
                  <pre class="p-2 rounded overflow-x-auto text-xs">{{ JSON.stringify((part as any).toolInvocation.args, null, 2) }}</pre>
                </div>
                <div v-if="(part as any).toolInvocation?.result" class="flex flex-col gap-1">
                  <span class="font-semibold">Result:</span>
                  <div class="p-2 rounded overflow-x-auto">
                    <template v-if="typeof (part as any).toolInvocation.result === 'string'">
                      <pre class="text-xs whitespace-pre-wrap break-words">{{ (part as any).toolInvocation.result }}</pre>
                    </template>
                    <template v-else>
                      <pre class="text-xs">{{ JSON.stringify((part as any).toolInvocation.result, null, 2) }}</pre>
                    </template>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-zinc-400">
                  <span>State: {{ (part as any).toolInvocation?.state }}</span>
                  <span v-if="(part as any).toolInvocation?.step !== undefined">Step: {{ (part as any).toolInvocation.step }}</span>
                  <span v-if="(part as any).toolInvocation?.toolCallId" class="font-mono text-[10px] opacity-70">{{ (part as any).toolInvocation.toolCallId }}</span>
                </div>
              </div>
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
    </template>
    <template v-else>
      <div class="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
        <template v-if="parts?.length">
          <div v-for="(part, i) in parts" :key="i">
            {{ part?.text }}
          </div>
        </template>
        <template v-else>
          {{ content }}
        </template>
      </div>
    </template>
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
      <UTooltip v-if="role === 'user'" text="Edit">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-pen-line"
          @click="$emit('start-edit')"
        />
      </UTooltip>
      <UTooltip v-if="last && role == 'assistant'" text="Reload">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-refresh-cw"
          @click="$emit('reload')"
        />
      </UTooltip>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
