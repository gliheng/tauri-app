<script setup lang="ts">
import { computed, PropType } from "vue";
import { tv } from "tailwind-variants";
import { Message } from "ai";
import MarkdownText from "@/components/MarkdownText.vue";
import FileImage from "@/components/FileImage.vue";

interface PlanTask {
  content: string;
  priority?: "high" | "medium" | "low";
  status: "completed" | "in_progress" | "pending";
}

interface PlanPart {
  type: "plan";
  plan: PlanTask[];
}

type MessagePart = any;

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
  parts: Array as PropType<MessagePart[]>,
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
  console.log(props.parts);
  navigator.clipboard.writeText(props.content || JSON.stringify(props.parts));
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
      <div class="w-full flex flex-col gap-2">
        <div
          v-for="(part, i) in displayParts"
          :key="i"
          class="empty:hidden"
        >
          <div v-if="part.type == 'text'">
            <MarkdownText :markdown="part.text" />
          </div>
          <div v-else-if="part.type == 'thought'" class="text-zinc-400">
            <MarkdownText :markdown="part.thought" />
          </div>
          <UCollapsible
            v-else-if="part.type == 'plan'"
            class="flex flex-col gap-2 w-full"
            :unmount-on-hide="false"
          >
            <UButton
              class="self-start group"
              :label="(() => {
                const planPart = part as PlanPart;
                const lastCompleted = planPart.plan.filter(t => t.status === 'completed').pop();
                const allPending = planPart.plan.every(t => t.status === 'pending');
                if (allPending) {
                  return `${planPart.plan.length} tasks planned`;
                }
                return lastCompleted ? lastCompleted.content : 'Starting plan...';
              })()"
              color="neutral"
              variant="subtle"
              leading-icon="i-lucide-list-checks"
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                label: 'text-left min-w-[200px]',
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            />
            <template #content>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <div class="space-y-2">
                  <div
                    v-for="(task, idx) in (part as PlanPart).plan"
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
      <UTooltip text="Copy text">
        <UButton
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-copy"
          @click="copyText"
        />
      </UTooltip>
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
