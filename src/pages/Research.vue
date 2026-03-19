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
  type ResearchResourceStatus,
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
const resourceMode = ref<ResearchResourceKind>("text");
const textTitle = ref("");
const textContent = ref("");
const urlTitle = ref("");
const urlValue = ref("");
const isSubmitting = ref(false);
const loadingResourceIds = ref<string[]>([]);
const resourcesOpen = ref("resources");

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

function inferUrlTitle(input: string): string {
  try {
    const url = new URL(input);
    const trimmedPath = url.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop();
    if (trimmedPath) {
      return decodeURIComponent(trimmedPath);
    }
    return url.hostname;
  } catch {
    return "Web Resource";
  }
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

async function addResource(): Promise<void> {
  if (isSubmitting.value) return;

  const kind = resourceMode.value;
  const now = new Date();
  let resource: ResearchResource | null = null;

  if (kind === "text") {
    if (!textContent.value.trim()) {
      toast.add({
        title: "Text is required",
        description: "Add the resource text before saving it.",
        icon: "i-lucide-circle-alert",
        color: "warning",
      });
      return;
    }

    resource = {
      id: nanoid(),
      topicId,
      kind: "text",
      title: textTitle.value.trim() || "Text Resource",
      content: textContent.value.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
  } else {
    const normalizedUrl = urlValue.value.trim();
    if (!normalizedUrl) {
      toast.add({
        title: "URL is required",
        description: "Add a source URL before saving it.",
        icon: "i-lucide-circle-alert",
        color: "warning",
      });
      return;
    }

    resource = {
      id: nanoid(),
      topicId,
      kind: "url",
      title: urlTitle.value.trim() || inferUrlTitle(normalizedUrl),
      source: normalizedUrl,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
  }

  isSubmitting.value = true;
  try {
    await writeResearchResource(resource);
    await touchTopic();
    await refreshResources();
    textTitle.value = "";
    textContent.value = "";
    urlTitle.value = "";
    urlValue.value = "";
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
    <div class="border-b border-white/10 px-6 py-4">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div class="min-w-0">
          <hgroup class="flex flex-row items-center gap-3">
            <IconEdit v-model:icon="topic.icon" />
            <NameEdit v-model:name="topic.title" />
          </hgroup>
          <p class="mt-2 text-sm text-muted">
            Add sources to this topic and send them through ACP for zvec ingestion.
          </p>
        </div>

        <UBadge variant="soft" size="sm">{{ sortedResources.length }} resources</UBadge>
      </div>
    </div>

    <div class="flex flex-1 min-h-0 flex-col gap-6 overflow-auto p-6">
      <UAccordion
        v-model="resourcesOpen"
        :items="[
          {
            label: 'Resources',
            icon: 'i-lucide-library',
            value: 'resources',
            slot: 'resources',
          },
        ]"
        :unmount-on-hide="false"
      >
        <template #trailing="{ item, ui }">
          <div class="flex items-center gap-2">
            <UBadge
              v-if="item.value === 'resources'"
              variant="soft"
              size="sm"
            >
              {{ sortedResources.length }}
            </UBadge>
            <UIcon
              name="i-lucide-chevron-down"
              :class="ui.trailingIcon()"
            />
          </div>
        </template>
        <template #resources-body>
          <div class="space-y-6 pt-4">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h2 class="font-semibold">Add Resource</h2>
                    <p class="text-sm text-muted">Support for file uploads comes later. Start with text or a URL.</p>
                  </div>
                  <UTabs
                    v-model="resourceMode"
                    :items="[
                      { label: 'Text', icon: 'i-lucide-file-text', value: 'text' },
                      { label: 'URL', icon: 'i-lucide-link', value: 'url' },
                    ]"
                    variant="link"
                  />
                </div>
              </template>

              <div class="space-y-4">
                <template v-if="resourceMode === 'text'">
                  <UInput v-model="textTitle" placeholder="Optional title" />
                  <UTextarea
                    v-model="textContent"
                    :rows="8"
                    placeholder="Paste the text you want inserted into the research database"
                  />
                </template>

                <template v-else>
                  <UInput v-model="urlTitle" placeholder="Optional title" />
                  <UInput v-model="urlValue" placeholder="https://example.com/article" />
                </template>

                <div class="flex justify-end">
                  <UButton
                    icon="i-lucide-plus"
                    :loading="isSubmitting"
                    :disabled="isSubmitting"
                    @click="addResource"
                  >
                    Add And Ingest
                  </UButton>
                </div>
              </div>
            </UCard>

            <UCard class="min-h-0">
              <template #header>
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="font-semibold">Resources</h2>
                    <p class="text-sm text-muted">Each resource tracks its latest ingestion state.</p>
                  </div>
                  <UBadge variant="soft">{{ sortedResources.length }}</UBadge>
                </div>
              </template>

              <UEmpty
                v-if="sortedResources.length === 0"
                icon="i-lucide-library"
                title="No resources yet"
                description="Add pasted text or a URL to send content into the topic's RAG store."
                class="mx-auto w-fit py-10"
              />

              <div v-else class="space-y-3">
                <UCard
                  v-for="resource in sortedResources"
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
                        @click="retryResource(resource)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="soft"
                        size="sm"
                        @click="removeResource(resource.id)"
                      />
                    </div>
                  </div>
                </UCard>
              </div>
            </UCard>
          </div>
        </template>
      </UAccordion>

      <section class="min-h-0 flex-1">
        <UCard class="h-full">
          <template #header>
            <div>
              <h2 class="font-semibold">Research Chat</h2>
              <p class="text-sm text-muted">Placeholder for the later RAG chat workflow.</p>
            </div>
          </template>

          <div class="flex h-full min-h-[320px] flex-col justify-between rounded-xl border border-dashed border-default bg-muted/40 p-6">
            <div class="space-y-3">
              <UIcon name="i-lucide-message-square-dashed" class="text-3xl text-primary" />
              <h3 class="text-lg font-semibold">Chat comes next</h3>
              <p class="text-sm text-muted">
                This panel will host NotebookLM-style research chat once retrieval and conversation are added.
              </p>
            </div>

            <div class="space-y-2 text-sm text-muted">
              <p>Topic updated: {{ formatDate(topic.updatedAt) }}</p>
              <p>Ingestion agent: {{ currentAgent?.name ?? "None" }}</p>
              <p>Resources: {{ sortedResources.length }}</p>
            </div>
          </div>
        </UCard>
      </section>
    </div>
  </div>
</template>
