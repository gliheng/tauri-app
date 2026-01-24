<script setup lang="ts">
import { ref } from "vue";
import Tabs from "@/components/Tabs.vue";
import { useTabsStore } from "@/stores/tabs";
import { storeToRefs } from "pinia";

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
    <Tabs>
      <template #extra>
        <slot name="extra">
          <UModal v-model:open="commandPaletteOpen">
            <UButton
              icon="i-mdi-history"
              color="neutral"
              variant="soft"
            />
            <template #content>
              <Suspense>
                <CommandPalette @close="commandPaletteOpen = false" />
                <template #fallback>
                  <div class="h-30 flex items-center justify-center">
                    <Loader />
                  </div>
                </template>
              </Suspense>
            </template>
          </UModal>
          <ThemeSwitcher />
          <UButton
            :icon="showArtifactView ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            color="neutral"
            variant="soft"
            @click="toggleArtifactView"
          />
          <WindowControls v-if="platform === 'Win32'" />
        </slot>
      </template>
    </Tabs>
  </header>
</template>

<style lang="scss" scoped></style>
