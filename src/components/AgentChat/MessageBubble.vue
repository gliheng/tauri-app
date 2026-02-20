<script setup lang="ts">
import { computed, PropType } from "vue";
import { tv } from "tailwind-variants";
import MarkdownText from "@/components/MarkdownText.vue";
import FileImage from "@/components/FileImage.vue";
import type { Role, MessagePart } from "@/lib/acp";

const props = defineProps({
  message: {
    type: Object as PropType<{
      id: string;
      role: Role;
      content: string;
      parts?: MessagePart[];
    }>,
    required: true,
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

const displayParts = computed(() => props.message.parts ?? []);

function copyText() {
  console.log(props.message.parts);
  navigator.clipboard.writeText(props.message.content || JSON.stringify(props.message.parts));
}
</script>

<template>
  <section :class="bubbleStyle({ role: props.message.role })">
    <template v-if="props.message.role == 'assistant'">
      <h1 class="flex items-center gap-2 mb-2 hidden">
        <UAvatar
          :class="{ 'animate-bounce': loading }"
          icon="i-lucide-bot"
          size="md"
        />
        Assistant
      </h1>
      <div class="w-full flex flex-col gap-2">
        <div
          v-for="(part, i) in displayParts"
          :key="i"
        >
          <div v-if="part.type == 'text'" :data-part-type="part.type">
            <MarkdownText v-if="part.text" :markdown="part.text" />
          </div>
          <UCollapsible
            v-else-if="part.type == 'thought'"
            class="flex flex-col gap-2 w-full"
            :unmount-on-hide="false"
            :data-part-type="part.type"
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
                base: i === displayParts.length - 1 ? 'animate-pulse' : '',
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            />
            <template #content>
              <div v-if="part.thought" class="text-zinc-600 dark:text-zinc-400" :data-part-type="part.type">
                <MarkdownText class="opacity-60" :markdown="part.thought" />
              </div>
            </template>
          </UCollapsible>
          <UCollapsible
            v-else-if="part.type == 'plan'"
            class="flex flex-col gap-2 w-full"
            :unmount-on-hide="false"
            :data-part-type="part.type"
          >
            <UButton
              class="self-start group"
              :label="(() => {
                const lastCompleted = part.plan.filter(t => t.status === 'completed').pop();
                const lastInProgress = part.plan.filter(t => t.status === 'in_progress').pop();
                if (lastCompleted) {
                  return lastCompleted.content;
                }
                if (lastInProgress) {
                  return lastInProgress.content;
                }
                return `Created TODO list with ${part.plan.length} tasks`;
              })()"
              color="neutral"
              variant="ghost"
              size="sm"
              leading-icon="i-lucide-list-checks"
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                base: i === displayParts.length - 1 ? 'animate-pulse' : '',
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
                label: 'text-left min-w-[200px]',
              }"
            />
            <template #content>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <div class="space-y-2">
                  <div
                    v-for="(task, idx) in part.plan"
                    :key="idx"
                    class="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <UIcon
                        v-if="task.status === 'completed'"
                        name="i-lucide-check-circle-2"
                        class="w-5 h-5 text-green-500"
                      />
                      <UIcon
                        v-else-if="task.status === 'in_progress'"
                        name="i-lucide-loader-circle"
                        class="w-5 h-5 text-blue-500 animate-spin"
                      />
                      <UIcon
                        v-else
                        name="i-lucide-circle"
                        class="w-5 h-5 text-gray-400"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm" :class="{
                        'line-through text-gray-500': task.status === 'completed',
                        'font-medium': task.status === 'in_progress'
                      }">
                        {{ task.content }}
                      </p>
                    </div>
                    <UBadge
                      v-if="task.priority"
                      :color="task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'gray'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ task.priority }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </template>
          </UCollapsible>
          <UCollapsible
            v-else-if="part.type == 'tool_call'"
            class="flex flex-col gap-2 w-full"
            :unmount-on-hide="false"
            :data-part-type="part.type"
          >
            <UButton
              class="self-start group min-w-[200px] max-w-full"
              :label="part.title"
              color="neutral"
              variant="ghost"
              size="sm"
              :data-status="part.status"
              leading-icon="i-lucide-hammer"
              :trailing-icon="part.status == 'completed' ? 'i-heroicons-check-circle-20-solid' : part.status == 'failed' ? 'i-heroicons-x-circle-20-solid' : 'i-lucide-chevron-down'"
              :ui="{
                label: 'text-left truncate flex-1',
                trailingIcon: 'group-data-[status=completed]:text-primary group-data-[status=failed]:text-error',
              }"
            />
            <template #content>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Kind:</span>
                    <UBadge color="neutral" variant="subtle" size="sm">
                      {{ part.kind }}
                    </UBadge>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <UBadge :color="(() => {
                      if (part.status === 'completed') return 'success';
                      if (part.status === 'failed') return 'error';
                      if (part.status === 'in_progress') return 'info';
                      return 'neutral';
                    })()" variant="subtle" size="sm">
                      {{ part.status }}
                    </UBadge>
                  </div>
                  <div v-if="part.locations?.length" class="space-y-1">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Locations:</span>
                    <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                      {{ JSON.stringify(part.locations, null, 2) }}
                    </div>
                  </div>
                  <div v-if="part.content?.length" class="space-y-1">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Content:</span>
                    <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                      {{ JSON.stringify(part.content, null, 2) }}
                    </div>
                  </div>
                  <div v-if="part.rawInput" class="space-y-1">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Input:</span>
                    <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                      {{ JSON.stringify(part.rawInput, null, 2) }}
                    </div>
                  </div>
                  <div v-if="part.rawOutput" class="space-y-1">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Output:</span>
                    <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                      {{ JSON.stringify(part.rawOutput, null, 2) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UCollapsible>
          <FileImage
            v-else-if="part.type == 'image'"
            class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-md"
            :url="part.uri || `data:${part.mimeType};base64,${part.data}`"
            :data-part-type="part.type"
          />
          <div
            v-else-if="part.type == 'audio'"
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
            :data-part-type="part.type"
          >
            <audio
              controls
              :src="`data:${part.mimeType};base64,${part.data}`"
              class="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
          <div
            v-else-if="part.type == 'resource'"
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
            :data-part-type="part.type"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-file" class="w-5 h-5 text-gray-500" />
                <span class="text-sm font-medium">Resource</span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-mono text-xs">{{ part.resource.uri }}</span>
              </div>
              <div v-if="part.resource.mimeType" class="text-xs text-gray-500">
                Type: {{ part.resource.mimeType }}
              </div>
              <div v-if="part.resource.text" class="text-sm mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                {{ part.resource.text }}
              </div>
            </div>
          </div>
          <div
            v-else-if="part.type == 'resource_link'"
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            :data-part-type="part.type"
          >
            <a
              :href="part.uri"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-start gap-3 group"
            >
              <UIcon name="i-lucide-link" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                  {{ part.title || part.name }}
                </div>
                <div v-if="part.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ part.description }}
                </div>
                <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span v-if="part.mimeType" class="font-mono">{{ part.mimeType }}</span>
                  <span v-if="part.size" class="font-mono">{{ (part.size / 1024).toFixed(2) }} KB</span>
                </div>
                <div class="text-xs text-gray-400 mt-1 font-mono truncate">
                  {{ part.uri }}
                </div>
              </div>
              <UIcon name="i-lucide-external-link" class="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </a>
          </div>
        </div>
        <div
          v-if="props.message.content && displayParts.length == 0"
          class="mb-2"
        >
          <MarkdownText v-if="props.message.content" :markdown="props.message.content" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
        <template v-if="props.message.parts?.length">
          <div v-for="(part, i) in props.message.parts" :key="i" class="whitespace-pre-wrap">
            {{ part?.text }}
          </div>
        </template>
        <template v-else>
          <div class="whitespace-pre-wrap">
            {{ props.message.content }}
          </div>
        </template>
      </div>
    </template>
    <div class="flex flex-row items-center gap-1 hidden">
      <UTooltip text="Copy text">
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          trailing-icon="i-lucide-copy"
          @click="copyText"
        />
      </UTooltip>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
