<script setup lang="ts">
import type { PropType } from "vue";
import type { Agent } from "@/db";

defineProps({
  topicUpdatedAt: {
    type: Date,
    required: true,
  },
  currentAgent: {
    type: Object as PropType<Agent | undefined>,
    default: undefined,
  },
  resourceCount: {
    type: Number,
    default: 0,
  },
});

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
</script>

<template>
  <section class="min-h-0 flex-1">
    <UCard class="h-full">
      <div class="flex h-full min-h-[320px] flex-col justify-between rounded-xl border border-dashed border-default bg-muted/40 p-6">
        <div class="space-y-3">
          <UIcon name="i-lucide-message-square-dashed" class="text-3xl text-primary" />
          <h3 class="text-lg font-semibold">Chat comes next</h3>
          <p class="text-sm text-muted">
            This panel will host NotebookLM-style research chat once retrieval and conversation are added.
          </p>
        </div>

        <div class="space-y-2 text-sm text-muted">
          <p>Topic updated: {{ formatDate(topicUpdatedAt) }}</p>
          <p>Ingestion agent: {{ currentAgent?.name ?? "None" }}</p>
          <p>Resources: {{ resourceCount }}</p>
        </div>
      </div>
    </UCard>
  </section>
</template>
