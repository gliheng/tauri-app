<script setup lang="ts">
import { ref } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import Settings from "@/components/Settings.vue";
import Tabs from "@/components/Tabs.vue";
import { useTabsStore } from "@/stores/tabs";

const { toggleExpanded } = useTabsStore();
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
</script>

<template>
  <header class="flex flex-row items-center bg-elevated shadow select-none">
    <WindowControls v-if="tauri && platform.startsWith('Mac')" />
    <Tabs>
      <template #extra>
        <slot name="extra">
          <UModal v-model:open="commandPaletteOpen">
            <UButton icon="i-mdi-history" color="neutral" variant="ghost" />
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
            icon="i-mdi-arrow-expand-horizontal"
            color="neutral"
            variant="ghost"
            @click="toggleExpanded"
          />
          <UModal
            class=""
            :ui="{
              content: 'min-w-[600px] min-h-[400px]',
            }"
          >
            <UButton icon="i-mdi-cog" color="neutral" variant="ghost" />
            <template #content>
              <Settings />
            </template>
          </UModal>
        </slot>
      </template>
    </Tabs>
    <WindowControls v-if="tauri && platform === 'Win32'" />
  </header>
</template>

<style lang="scss" scoped></style>
