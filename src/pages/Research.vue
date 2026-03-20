<script setup lang="ts">
import { computed, onActivated, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { throttle } from "lodash-es";
import { nanoid } from "nanoid";
import {
  deleteResearchResource,
  getAgents,
  getResearchResources,
  getResearchTopic,
  updateResearchTopic,
  writeResearchResource,
  writeResearchTopic,
  type Agent,
  type ResearchResource,
  type ResearchResourceKind,
} from "@/db";
import { useTabsStore } from "@/stores/tabs";
import { useResearchIngestion } from "@/composables/useResearchIngestion";

const route = useRoute();
const tabsStore = useTabsStore();
const toast = useToast();
const { ingestResource } = useResearchIngestion();

const topicId = route.params.id as string;
const existingTopic = await getResearchTopic(topicId);

if (!existingTopic) {
  const now = new Date();
  await writeResearchTopic({
    id: topicId,
    title: "New Research Topic",
    icon: "i-lucide-library-big",
    createdAt: now,
    updatedAt: now,
  });
}

const initialTopic = existingTopic ?? (await getResearchTopic(topicId));
if (!initialTopic) {
  throw new Error("Failed to initialize research topic");
}

const availableAgents = ref<Agent[]>(await getAgents());
const topic = ref({
  ...initialTopic,
});
const resources = ref<ResearchResource[]>(await getResearchResources(topicId));
const isSubmitting = ref(false);
const loadingResourceIds = ref<string[]>([]);
const drawerOpen = ref(false);

const currentAgent = computed(() =>
  availableAgents.value.find(agent => agent.id === topic.value.agentId) ?? availableAgents.value[0]
);

if (!topic.value.agentId && availableAgents.value[0]) {
  topic.value.agentId = availableAgents.value[0].id;
}

const sortedResources = computed(() => resources.value);

const throttledTopicSave = throttle(async () => {
  await updateResearchTopic(topicId, {
    title: topic.value.title,
    icon: topic.value.icon,
    agentId: topic.value.agentId,
    updatedAt: new Date(),
  });
}, 600);

watch(
  () => [topic.value.title, topic.value.icon, topic.value.agentId],
  async () => {
    await throttledTopicSave();
    tabsStore.setTitle(`/research/${topicId}`, topic.value.title);
  }
);

onActivated(async () => {
  tabsStore.openTab(`/research/${topicId}`, topic.value.title);
  availableAgents.value = await getAgents();
  if (!topic.value.agentId && availableAgents.value[0]) {
    topic.value.agentId = availableAgents.value[0].id;
    await updateResearchTopic(topicId, {
      agentId: topic.value.agentId,
      updatedAt: new Date(),
    });
  }
  resources.value = await getResearchResources(topicId);
});

async function touchTopic(): Promise<void> {
  await updateResearchTopic(topicId, {
    updatedAt: new Date(),
  });
}

async function refreshResources(): Promise<void> {
  resources.value = await getResearchResources(topicId);
}

async function persistResource(
  resource: ResearchResource,
  data: Partial<ResearchResource>
): Promise<ResearchResource> {
  const updated = {
    ...resource,
    ...data,
  };
  await writeResearchResource(updated);
  return updated;
}

async function runIngestion(resource: ResearchResource): Promise<void> {
  const agent = currentAgent.value;
  if (!agent) {
    await persistResource(resource, {
      status: "error",
      error: "Select an ACP agent for this topic before ingesting resources.",
      updatedAt: new Date(),
    });
    await refreshResources();
    return;
  }

  loadingResourceIds.value = [...loadingResourceIds.value, resource.id];
  resource = await persistResource(resource, {
    status: "ingesting",
    error: undefined,
    updatedAt: new Date(),
  });
  await refreshResources();

  try {
    await ingestResource(topic.value, resource, agent);
    await persistResource(resource, {
      status: "ready",
      error: undefined,
      updatedAt: new Date(),
    });
    await touchTopic();
    toast.add({
      title: "Resource ingested",
      description: `${resource.title} was sent to ACP for zvec ingestion.`,
      icon: "i-lucide-database-zap",
      color: "success",
    });
  } catch (error) {
    await persistResource(resource, {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      updatedAt: new Date(),
    });
    toast.add({
      title: "Ingestion failed",
      description: error instanceof Error ? error.message : String(error),
      icon: "i-lucide-circle-alert",
      color: "error",
    });
  } finally {
    loadingResourceIds.value = loadingResourceIds.value.filter(id => id !== resource.id);
    await refreshResources();
  }
}

async function handleAddResource(data: {
  kind: ResearchResourceKind;
  title: string;
  content?: string;
  source?: string;
}): Promise<void> {
  if (isSubmitting.value) return;

  const now = new Date();
  const resource: ResearchResource = {
    id: nanoid(),
    topicId,
    kind: data.kind,
    title: data.title,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...(data.kind === "text" ? { content: data.content } : { source: data.source }),
  };

  isSubmitting.value = true;
  try {
    await writeResearchResource(resource);
    await touchTopic();
    await refreshResources();
    await runIngestion(resource);
  } finally {
    isSubmitting.value = false;
  }
}

async function retryResource(resource: ResearchResource): Promise<void> {
  await runIngestion(resource);
}

async function removeResource(resourceId: string): Promise<void> {
  await deleteResearchResource(resourceId);
  await touchTopic();
  await refreshResources();
}
</script>

<template>
  <div class="flex size-full min-h-0 flex-col overflow-hidden">
    <ResearchHeader
      v-model:title="topic.title"
      v-model:icon="topic.icon"
      :resource-count="sortedResources.length"
    >
        <UDrawer v-model:open="drawerOpen" direction="right">
          <UButton
            icon="i-lucide-library"
            color="neutral"
            variant="subtle"
          >
            Resources
            <UBadge variant="soft" size="sm" class="ml-2">{{ sortedResources.length }}</UBadge>
          </UButton>

          <template #content>
            <div class="flex h-full w-96 flex-col bg-default p-6">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold">Resources</h3>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="drawerOpen = false" />
              </div>
              <div class="flex-1 overflow-auto space-y-6">
                <AddResourceForm
                  :is-submitting="isSubmitting"
                  @submit="handleAddResource"
                />

                <ResourceList
                  :resources="sortedResources"
                  :loading-resource-ids="loadingResourceIds"
                  @retry="retryResource"
                  @remove="removeResource"
                />
              </div>
            </div>
          </template>
        </UDrawer>
    </ResearchHeader>

    <div class="relative flex-1 min-h-0 overflow-hidden">
      <ResearchChat
        :topic-updated-at="topic.updatedAt"
        :current-agent="currentAgent"
        :resource-count="sortedResources.length"
      />
    </div>
  </div>
</template>
