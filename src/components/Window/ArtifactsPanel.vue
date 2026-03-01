<script setup lang="ts">
import { ref, computed } from "vue";
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { useArtifactsStore } from "@/stores/artifacts";
import { storeToRefs } from "pinia";
import WorkspaceEditor from "@/components/WorkspaceEditor/WorkspaceEditor.vue";
import Terminal from "@/components/WorkspaceEditor/Terminal.vue";
import WebView from "@/components/WebView/WebView.vue";

const artifactsStore = useArtifactsStore();
const { artifacts, activeArtifactKey } = storeToRefs(artifactsStore);

const isExpanded = ref(false);

const ui = {
  root: 'relative flex flex-col h-full',
  list(expanded: boolean): string {
    return `relative flex items-center gap-1 border-none bg-[--ui-bg-default] rounded-t-md overflow-x-auto p-1 select-none bg-elevated/50 shadow ${expanded ? 'pl-10' : ''}`;
  },
  indicator: 'absolute left-0 inset-y-2 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) transition-[translate,width] duration-200 bg-primary rounded-md shadow-xs',
  trigger: 'relative inline-flex items-center gap-1.5 text-default hover:bg-[var(--ui-bg-elevated)]/25 px-2 py-1.5 text-sm rounded-md disabled:cursor-not-allowed disabled:opacity-75 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-color-primary)] focus:outline-none transition-colors group data-[state=active]:text-white',
  triggerIcon: 'size-4 shrink-0',
  triggerLabel: 'truncate'
};

const containerClass = computed(() => {
  return isExpanded.value
    ? 'fixed inset-0 z-50 bg-[var(--ui-bg)]'
    : 'relative flex flex-col h-full';
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function getArtifactDisplayName(id: string): string {
  const segments = id.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || id;
  return lastSegment.length > 20 ? lastSegment.slice(0, 17) + '...' : lastSegment;
}
</script>

<template>
  <Suspense>
    <div :class="containerClass">
      <!-- Expand button overlay -->
      <UTooltip
        v-if="artifacts.length > 0"
        :text="isExpanded ? 'Collapse to panel' : 'Expand to fullscreen'"
      >
        <UButton
          @click="toggleExpand"
          class="absolute top-2 right-2 z-10"
          color="neutral"
          variant="soft"
        >
          <UIcon :name="isExpanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" class="size-4" />
        </UButton>
      </UTooltip>

      <!-- Empty state -->
      <div v-if="artifacts.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
        <UIcon name="i-lucide-file-stack" class="size-16 opacity-30" />
        <p class="text-center text-sm">
          Agent related files will be displayed here.
        </p>
      </div>

      <!-- Tabs -->
      <TabsRoot v-else v-model="activeArtifactKey" :class="ui.root" :unmountOnHide="false">
        <TabsList :class="ui.list(isExpanded)" data-tauri-drag-region>
          <TabsIndicator :class="ui.indicator" />

          <TabsTrigger
            v-for="artifact in artifacts"
            :key="artifact.key"
            :value="artifact.key"
            :class="ui.trigger"
          >
            <UIcon v-if="artifact.type === 'terminal'" name="i-lucide-square-terminal" :class="ui.triggerIcon" />
            <UIcon v-else-if="artifact.type === 'webview'" name="i-lucide-globe" :class="ui.triggerIcon" />
            <UIcon v-else name="i-lucide-folder" :class="ui.triggerIcon" />
            <span :class="ui.triggerLabel">{{ artifact.type === 'terminal' ? 'Terminal' : artifact.type === 'webview' ? 'WebView' : getArtifactDisplayName(artifact.id) }}</span>
            <UButton
              @click.stop="artifactsStore.removeArtifact(artifact.id, artifact.type)"
              :class="ui.triggerIcon"
              class="p-0"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent
          v-for="artifact in artifacts"
          :key="artifact.key"
          :value="artifact.key"
          class="flex-1 min-h-0"
        >
          <WorkspaceEditor
            v-if="artifact.type === 'workspace'"
            :cwd="artifact.id"
          />
          <Terminal
            v-else-if="artifact.type === 'terminal'"
            :cwd="artifact.id.replace('terminal::', '')"
          />
          <WebView
            v-else-if="artifact.type === 'webview'"
            :content="artifact.content || ''"
            :content-type="artifact.id.split('::')[0]"
          />
        </TabsContent>
      </TabsRoot>
    </div>
    <template #fallback>
      <div class="h-30 flex items-center justify-center">
        <Spinner />
      </div>
    </template>
  </Suspense>
</template>
