<script setup lang="ts">
import { computed, onActivated } from "vue";
import { useRouter } from "vue-router";
import { nanoid } from "nanoid";
import { confirm } from "@tauri-apps/plugin-dialog";
import { writeResearchTopic } from "@/db";
import { useResearchStore } from "@/stores/research";
import { useTabsStore } from "@/stores/tabs";

const router = useRouter();
const tabsStore = useTabsStore();
const researchStore = useResearchStore();

onActivated(() => {
  tabsStore.openTab("/research-list", "Research");
  researchStore.loadTopics();
});

const sortedTopics = computed(() => researchStore.topics);

async function createTopic(): Promise<void> {
  const id = nanoid();
  const now = new Date();
  const topic = {
    id,
    title: "New Research Topic",
    icon: "i-lucide-library-big",
    createdAt: now,
    updatedAt: now,
  };

  await writeResearchTopic(topic);
  await researchStore.loadTopics();
  tabsStore.openTab(`/research/${id}`, topic.title);
  router.push({
    name: "research-topic",
    params: { id },
  });
}

function openTopic(id: string, title: string): void {
  tabsStore.openTab(`/research/${id}`, title);
  router.push({
    name: "research-topic",
    params: { id },
  });
}

async function deleteTopic(id: string, event: Event): Promise<void> {
  event.stopPropagation();

  const accepted = await confirm(
    "This will remove the research topic and all of its resources.",
    { title: "Delete Research Topic", kind: "warning" }
  );

  if (!accepted) return;

  await researchStore.deleteTopic(id);
  tabsStore.closeTab(`/research/${id}`);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div class="size-full flex flex-col">
    <div class="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <div>
        <h1 class="text-lg font-semibold">Research</h1>
        <p class="text-sm text-muted">Build a topic, collect resources, and prepare a future chat context.</p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="New Topic"
        variant="subtle"
        @click="createTopic"
      />
    </div>

    <div class="flex-1 overflow-auto p-6">
      <UEmpty
        v-if="sortedTopics.length === 0"
        icon="i-lucide-library-big"
        title="No research topics yet"
        description="Create a topic to start collecting sources for ACP ingestion."
        class="w-fit mx-auto"
      >
        <template #actions>
          <UButton
            icon="i-lucide-plus"
            label="Create Topic"
            @click="createTopic"
          />
        </template>
      </UEmpty>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="topic in sortedTopics"
          :key="topic.id"
          class="group relative cursor-pointer transition-all hover:scale-[1.02]"
          @click="openTopic(topic.id, topic.title)"
        >
          <div class="flex items-start gap-3">
            <UIcon :name="topic.icon" class="mt-0.5 text-2xl text-primary" />
            <div class="min-w-0 flex-1">
              <div class="min-w-0">
                <h2 class="truncate font-semibold">{{ topic.title }}</h2>
                <p class="mt-1 text-sm text-muted">
                  Open the topic to manage sources from the resources drawer.
                </p>
              </div>

              <p class="mt-4 text-sm text-muted">
                Updated {{ formatDate(topic.updatedAt) }}
              </p>
            </div>
          </div>

          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="solid"
            size="sm"
            class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            @click="deleteTopic(topic.id, $event)"
          />
        </UCard>
      </div>
    </div>
  </div>
</template>
