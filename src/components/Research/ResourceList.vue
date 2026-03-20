<script setup lang="ts">
import type { PropType } from "vue";
import type { ResearchResource, ResearchResourceStatus } from "@/db";

defineProps({
  resources: {
    type: Array as PropType<ResearchResource[]>,
    required: true,
  },
  loadingResourceIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  retry: [resource: ResearchResource];
  remove: [resourceId: string];
}>();

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusColor(status: ResearchResourceStatus): "neutral" | "warning" | "success" | "error" {
  if (status === "ready") return "success";
  if (status === "error") return "error";
  if (status === "ingesting") return "warning";
  return "neutral";
}
</script>

<template>
  <UCard class="min-h-0">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-semibold">Resources</h2>
          <p class="text-sm text-muted">Each resource tracks its latest ingestion state.</p>
        </div>
        <UBadge variant="soft">{{ resources.length }}</UBadge>
      </div>
    </template>

    <UEmpty
      v-if="resources.length === 0"
      icon="i-lucide-library"
      title="No resources yet"
      description="Add pasted text or a URL to send content into the topic's RAG store."
      class="mx-auto w-fit py-10"
    />

    <div v-else class="space-y-3">
      <UCard
        v-for="resource in resources"
        :key="resource.id"
        class="border border-default"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate font-medium">{{ resource.title }}</h3>
              <UBadge :color="getStatusColor(resource.status)" variant="soft" size="sm">
                {{ resource.status }}
              </UBadge>
              <UBadge variant="subtle" size="sm">
                {{ resource.kind }}
              </UBadge>
            </div>

            <p v-if="resource.source" class="mt-2 truncate text-sm text-primary">
              {{ resource.source }}
            </p>
            <p v-if="resource.content" class="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted">
              {{ resource.content }}
            </p>
            <p v-if="resource.error" class="mt-2 whitespace-pre-wrap text-sm text-error">
              {{ resource.error }}
            </p>

            <p class="mt-3 text-xs text-muted">
              Updated {{ formatDate(resource.updatedAt) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UButton
              v-if="resource.status === 'error'"
              icon="i-lucide-rotate-cw"
              color="warning"
              variant="soft"
              size="sm"
              :loading="loadingResourceIds.includes(resource.id)"
              @click="emit('retry', resource)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="soft"
              size="sm"
              @click="emit('remove', resource.id)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </UCard>
</template>