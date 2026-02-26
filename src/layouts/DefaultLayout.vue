<script setup lang="ts">
import { Suspense, KeepAlive, useTemplateRef, watch, ref } from "vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { useTabsStore } from "@/stores/tabs";
import { useArtifactsStore } from "@/stores/artifacts";
import { storeToRefs } from "pinia";
import { eventBus } from "@/utils/eventBus";
import WindowHeader from "@/components/Window/WindowHeader.vue";
import Sidebar from "@/components/Window/Sidebar.vue";
import ArtifactsPanel from "@/components/Window/ArtifactsPanel.vue";
import Loader from "@/components/Loader.vue";

const tabsStore = useTabsStore();
const { showArtifactView } = storeToRefs(tabsStore);
const artifactViewPanel = useTemplateRef("artifactViewPanel");
const mountArtifactView = ref(false);

const artifactsStore = useArtifactsStore();
const { artifacts } = storeToRefs(artifactsStore);

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
          <ArtifactsPanel />
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
