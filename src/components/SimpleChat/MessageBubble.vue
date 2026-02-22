<script setup lang="ts">
import { computed, PropType } from "vue";
import { tv } from "tailwind-variants";
import { UIMessage, isToolUIPart } from "ai";
import MarkdownText from "@/components/MarkdownText.vue";
import FileImage from "@/components/FileImage.vue";
import MessageSwitcher from "./MessageSwitcher.vue";
import { messageToText } from "@/utils/message";

const props = defineProps({
  message: {
    type: Object as PropType<UIMessage>,
    required: true,
  },
  last: {
    type: Boolean,
    default: false,
  },
  loading: Boolean,
});

const emit = defineEmits(["start-edit", "regenerate"]);

const bubbleStyle = tv({
  base: "w-fit max-w-full flex flex-col",
  variants: {
    role: {
      user: "self-end items-end",
      assistant: "self-start items-start",
    },
  },
});

const fileParts = computed(() =>
  (props.message.parts ?? []).filter(
    (part): part is {
      type: "file";
      url: string;
      mediaType: string;
      filename?: string;
    } => part.type === "file"
  )
);

// Extract tool name from part type (e.g., 'tool-web_search' -> 'web_search')
function getToolNameFromPart(part: any): string {
  if (part.type?.startsWith('tool-')) {
    return part.type.slice(5);
  }
  return part.toolName || 'unknown';
}

function copyText() {
  const textContent = messageToText(props.message)
  navigator.clipboard.writeText(textContent);
}
</script>

<template>
  <section :class="bubbleStyle({ role: message.role as any })">
    <template v-if="message.role == 'assistant'">
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
          v-for="(part, i) in message.parts"
          :key="i"
          class="mb-2"
        >
          <div v-if="part.type == 'text'">
            <MarkdownText v-if="part.text" :markdown="part.text" />
          </div>
          <UCollapsible
            v-else-if="part.type == 'reasoning'"
            class="flex flex-col gap-2"
            :unmount-on-hide="false"
          >
            <UButton
              class="self-start group"
              label="Thought"
              color="neutral"
              variant="ghost"
              size="sm"
              leading-icon="i-lucide-brain"
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                base: i === (message.parts ?? []).length - 1 ? 'animate-pulse' : '',
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            >
            </UButton>
            <template #content>
              <MarkdownText class="opacity-60" v-if="part.text" :markdown="part.text" />
            </template>
          </UCollapsible>
          <UCollapsible
            v-else-if="isToolUIPart(part)"
            class="flex flex-col gap-2"
            :unmount-on-hide="false"
          >
            <UButton
              class="self-start group"
              :label="`Tool: ${getToolNameFromPart(part)}`"
              color="neutral"
              variant="ghost"
              size="sm"
              leading-icon="i-lucide-terminal"
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                base: i === (message.parts ?? []).length - 1 ? 'animate-pulse' : '',
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            >
            </UButton>
            <template #content>
              <div class="flex flex-col gap-3 text-sm">
                <div v-if="(part as any).input" class="flex flex-col gap-1">
                  <span class="font-semibold">Arguments:</span>
                  <pre class="p-2 rounded overflow-x-auto text-xs">{{ JSON.stringify((part as any).input, null, 2) }}</pre>
                </div>
                <div v-if="(part as any).output" class="flex flex-col gap-1">
                  <span class="font-semibold">Result:</span>
                  <div class="p-2 rounded overflow-x-auto">
                    <template v-if="typeof (part as any).output === 'string'">
                      <pre class="text-xs whitespace-pre-wrap break-words">{{ (part as any).output }}</pre>
                    </template>
                    <template v-else>
                      <pre class="text-xs">{{ JSON.stringify((part as any).output, null, 2) }}</pre>
                    </template>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-zinc-400">
                  <span>State: {{ (part as any).state }}</span>
                  <span v-if="(part as any).toolCallId" class="font-mono text-[10px] opacity-70">{{ (part as any).toolCallId }}</span>
                </div>
              </div>
            </template>
          </UCollapsible>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
        <template v-if="message.parts?.length">
          <div v-for="(part, i) in message.parts" :key="i" class="whitespace-pre-wrap">
            <template v-if="part.type === 'text'">
              {{ part.text }}
            </template>
          </div>
        </template>
      </div>
      <FileImage
        v-for="(file, index) of fileParts"
        class="max-w-full mt-2"
        :key="index"
        :url="file.url"
      />
    </template>
    <div class="flex flex-row items-center gap-1 mt-2">
      <MessageSwitcher :id="message.id" />
      <UTooltip text="Copy text">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-copy"
          @click="copyText"
        />
      </UTooltip>
      <UTooltip v-if="message.role === 'user'" text="Edit">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-pen-line"
          @click="$emit('start-edit')"
        />
      </UTooltip>
      <UTooltip v-if="last && message.role == 'assistant'" text="Reload">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-refresh-cw"
          @click="$emit('regenerate')"
        />
      </UTooltip>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
