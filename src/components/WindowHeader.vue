<script setup lang="ts">
import { ref } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import Tabs from "@/components/Tabs.vue";
import { useTabsStore } from "@/stores/tabs";
import { storeToRefs } from "pinia";
import { isAppleDevice } from "@/utils/device";

const tauri = isTauri();
const platform = navigator.platform;

const tabsStore = useTabsStore();

const commandPaletteOpen = ref(false);
defineShortcuts({
  meta_p: () => {
    commandPaletteOpen.value = !commandPaletteOpen.value;
  },
  meta_w: () => {
    tabsStore.closeActiveTab();
  },
});

const { showArtifactView } = storeToRefs(tabsStore);

function toggleArtifactView() {
  showArtifactView.value = !showArtifactView.value;
}
</script>

<template>
  <header class="flex flex-row items-center bg-elevated shadow select-none">
    <WindowControls class="fixed left-0 top-2" v-if="tauri && platform.startsWith('Mac')" />
    <Tabs>
      <template #extra>
        <slot name="extra">
          <UModal v-model:open="commandPaletteOpen">
            <UButton
              icon="i-mdi-history"
              color="neutral"
              variant="ghost"
            />
            <template #content>
              <Suspense>
                <CommandPalette @close="commandPaletteOpen = false" />
                <template #fallback>
                  <div class="h-30 flex items-center justify-center">
                    <Spinner />
                  </div>
                </template>
              </Suspense>
            </template>
          </UModal>
          <ThemeSwitcher />
          <UButton
            v-if="isAppleDevice"
            :icon="showArtifactView ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            color="neutral"
            variant="ghost"
            @click="toggleArtifactView"
          />
          <UDrawer v-else v-model:open="showArtifactView" direction="right">
            <UButton
              :icon="showArtifactView ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
              color="neutral"
              variant="ghost"
            />

            <template #body>
              <div class="p-4">Artifact View Content</div>
            </template>
          </UDrawer>
        </slot>
      </template>
    </Tabs>
    <WindowControls v-if="tauri && platform === 'Win32'" />
  </header>
</template>

<style lang="scss" scoped></style>
