<script setup lang="ts">
import { Suspense, KeepAlive, useTemplateRef, watch, ref } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { useTabsStore } from "@/stores/tabs";
import { useArtifactsStore } from "@/stores/artifacts";
import { storeToRefs } from "pinia";
import { eventBus } from "@/utils/eventBus";
import WindowHeader from "@/components/WindowHeader.vue";
import Sidebar from "@/components/Sidebar.vue";
import Spinner from "@/components/Spinner.vue";
import CodeEditor from "@/components/CodeEditor/CodeEditor.vue";
import Terminal from "@/components/CodeEditor/Terminal.vue";

const tabsStore = useTabsStore();
const { showArtifactView } = storeToRefs(tabsStore);
const artifactViewPanel = useTemplateRef("artifactViewPanel");
const mountArtifactView = ref(false);

const artifactsStore = useArtifactsStore();
const { artifacts, activeArtifactKey } = storeToRefs(artifactsStore);

const ui = {
  root: 'relative flex flex-col h-full',
  list: 'relative flex items-center gap-1 border-none bg-[--ui-bg-default] rounded-t-md overflow-x-auto p-1 select-none bg-elevated/50 shadow',
  indicator: 'absolute left-0 inset-y-2 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) transition-[translate,width] duration-200 bg-primary rounded-md shadow-xs',
  trigger: 'relative inline-flex items-center gap-1.5 text-default hover:bg-[var(--ui-bg-elevated)]/50 px-2 py-1.5 text-sm rounded-md disabled:cursor-not-allowed disabled:opacity-75 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-color-primary)] focus:outline-none transition-colors group data-[state=active]:text-white',
  triggerIcon: 'size-4 shrink-0',
  triggerLabel: 'truncate'
};

watch(showArtifactView, (show) => {
  if (show) {
    if (!mountArtifactView.value) {
      mountArtifactView.value = true;
    } else if (artifactViewPanel.value!.isCollapsed) {
      artifactViewPanel.value?.expand();
    }
  } else if (!artifactViewPanel.value!.isCollapsed) {
    artifactViewPanel.value!.collapse();
  }
});

watch(() => artifacts.value.length, (count) => {
  if (count > 0 && !showArtifactView.value) {
    showArtifactView.value = true;
  } else if (count === 0 && showArtifactView.value) {
    showArtifactView.value = false;
  }
}, { immediate: true });

eventBus.on('artifact', (msg: string) => {
  const [type, id] = msg.split('::');
  if (type === 'workspace' || type === 'terminal') {
    artifactsStore.addArtifact(id, type);
  }
});

function getArtifactDisplayName(id: string): string {
  const segments = id.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || id;
  return lastSegment.length > 20 ? lastSegment.slice(0, 17) + '...' : lastSegment;
}

</script>

<template>
  <UDashboardGroup>
    <Sidebar />
    <SplitterGroup class="flex-1" direction="horizontal">
      <SplitterPanel>
        <div class="h-full flex flex-col">
          <WindowHeader />
          <main class="size-full flex-1 flex flex-col min-h-0 z-[0]">
            <RouterView v-slot="{ Component, route }">
              <KeepAlive>
                <Suspense>
                  <component
                    v-if="Component"
                    :is="Component"
                    :key="route.path"
                  />
                  <template #fallback>
                    <div class="size-full flex items-center justify-center">
                      <Spinner />
                    </div>
                  </template>
                </Suspense>
              </KeepAlive>
            </RouterView>
          </main>
        </div>
      </SplitterPanel>
      <template v-if="mountArtifactView">
        <SplitterResizeHandle class="w-0.5 splitter-handle" />
        <SplitterPanel
          ref="artifactViewPanel"
          collapsible
          :default-size="50"
          :min-size="10"
          :collapsed-size="0"
          @collapse="showArtifactView = false"
          @expand="showArtifactView = true"
        >
          <Suspense>
            <div class="flex flex-col h-full">
              <div v-if="artifacts.length === 0" class="h-full flex items-center justify-center text-muted-foreground">
                <p class="text-center p-8">
                  This area will display agent-generated files.
                </p>
              </div>

              <TabsRoot v-else v-model="activeArtifactKey" :class="ui.root" :unmountOnHide="false">
                <TabsList :class="ui.list" data-tauri-drag-region>
                  <TabsIndicator :class="ui.indicator" />
                  
                  <TabsTrigger
                    v-for="artifact in artifacts"
                    :key="artifact.key"
                    :value="artifact.key"
                    :class="ui.trigger"
                  >
                    <UIcon v-if="artifact.type === 'terminal'" name="i-lucide-square-terminal" :class="ui.triggerIcon" />
                    <UIcon v-else name="i-lucide-folder" :class="ui.triggerIcon" />
                    <span :class="ui.triggerLabel">{{ artifact.type === 'terminal' ? 'Terminal' : getArtifactDisplayName(artifact.id) }}</span>
                    <button
                      @click.stop="artifactsStore.removeArtifact(artifact.id)"
                      :class="ui.triggerIcon"
                      class="group-hover:opacity-100 opacity-0 transition-opacity hover:bg-elevated rounded p-0.5"
                    >
                      <UIcon name="i-lucide-x" class="w-full h-full" />
                    </button>
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  v-for="artifact in artifacts"
                  :key="artifact.key"
                  :value="artifact.key"
                  class="flex-1 min-h-0"
                >
                  <CodeEditor
                    v-if="artifact.type === 'workspace'"
                    :cwd="artifact.id"
                  />
                  <Terminal
                    v-else-if="artifact.type === 'terminal'"
                    :cwd="artifact.id.replace('terminal::', '')"
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
        </SplitterPanel>
      </template>
    </SplitterGroup>
  </UDashboardGroup>
</template>

<style lang="scss" scoped>
.splitter-handle {
  transition: background-color 0.3s ease-in-out;
  background-color: var(--ui-border);
  &[data-state="drag"],
  &[data-state="hover"] {
    background-color: var(--ui-color-primary-500);
  }
}
</style>
