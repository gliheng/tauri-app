<script setup lang="ts">
import { isTauri } from "@tauri-apps/api/core";
import Settings from "@/components/Settings.vue";
import Tabs from "@/components/Tabs.vue";
import { useTabsStore } from "@/stores/tabs";

const { toggleExpanded } = useTabsStore();
</script>

<template>
  <header class="flex flex-row items-center bg-elevated shadow select-none">
    <WindowControls v-if="isTauri()" />
    <Tabs>
      <template #extra>
        <slot name="extra">
          <UModal>
            <UButton icon="i-mdi-history" color="neutral" variant="ghost" />
            <template #content>
              <CommandPalette />
            </template>
          </UModal>
          <ThemeSwitcher />
          <UButton
            icon="i-mdi-arrow-expand-horizontal"
            color="neutral"
            variant="ghost"
            @click="toggleExpanded"
          />
          <UModal>
            <UButton icon="i-mdi-cog" color="neutral" variant="ghost" />
            <template #content>
              <Settings />
            </template>
          </UModal>
        </slot>
      </template>
    </Tabs>
  </header>
</template>

<style lang="scss" scoped></style>
