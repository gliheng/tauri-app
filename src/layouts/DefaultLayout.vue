<script setup lang="ts">
import { ref, computed, Suspense, KeepAlive } from "vue";
import { useElementSize } from "@vueuse/core";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";
import { useTabsStore } from "@/stores/tabs";
import { storeToRefs } from "pinia";
import WindowHeader from "@/components/WindowHeader.vue";
import Sidebar from "@/components/Sidebar.vue";
import Spinner from "@/components/Spinner.vue";
import WorkspaceEditor from "@/components/CodeEditor/WorkspaceEditor.vue";

const root = ref(null);

const { width } = useElementSize(root);
const collapsed = computed(() => (56 / width.value) * 100);
const defaultSize = computed(() => (140 / width.value) * 100);
const minSidebarSize = computed(() => (200 / width.value) * 100);
const tabsStore = useTabsStore();
const { showArtifactView } = storeToRefs(tabsStore);
</script>

<template>
  <div class="h-screen" ref="root">
    <SplitterGroup v-if="width > 0" direction="horizontal">
      <SplitterPanel
        collapsible
        :default-size="defaultSize"
        :collapsed-size="collapsed"
        :min-size="minSidebarSize"
        :max-size="50"
      >
        <Sidebar />
      </SplitterPanel>
      <SplitterResizeHandle class="w-0.5 splitter-handle" />
      <SplitterPanel>
        <div class="h-full flex flex-col">
          <WindowHeader />
          <main class="size-full flex-1 flex flex-col min-h-0">
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
      <template v-if="showArtifactView">
        <SplitterResizeHandle class="w-0.5 splitter-handle" />
        <SplitterPanel>
          <WorkspaceEditor />
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
