<script setup lang="ts">
import { Suspense, KeepAlive, useTemplateRef, watch, ref } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { useTabsStore } from "@/stores/tabs";
import { storeToRefs } from "pinia";
import WindowHeader from "@/components/WindowHeader.vue";
import Sidebar from "@/components/Sidebar.vue";
import Spinner from "@/components/Spinner.vue";
import CodeEditor from "@/components/CodeEditor/CodeEditor.vue";
import { eventBus } from "@/utils/eventBus";

const tabsStore = useTabsStore();
const { showArtifactView } = storeToRefs(tabsStore);
const artifactViewPanel = useTemplateRef("artifactViewPanel");
const mountArtifactView = ref(false);
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

const currentArtifact = ref<{
  type: string;
  id: string;
}>();
eventBus.on('artifact', (msg: string) => {
  const [type, id] = msg.split('::');
  currentArtifact.value = { type, id };
});

</script>

<template>
  <div class="h-screen flex flex-row">
    <Sidebar class="w-50 h-full" />
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
            <CodeEditor
              v-if="currentArtifact?.type === 'workspace'"
              :cwd="currentArtifact.id"
            />
            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
              <div class="text-center p-8">
                <p class="text-lg font-medium mb-2">Agent Artifact</p>
                <p class="text-sm">This area will display agent-generated files.</p>
              </div>
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
  </div>
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
