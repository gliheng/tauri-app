<script setup lang="ts">
import { useTabsStore } from "@/stores/tabs";
import { storeToRefs } from "pinia";

const store = useTabsStore();
const { removeTab, addTab } = store;
const { tabs, activeTab } = storeToRefs(store);
</script>

<template>
  <div class="flex items-center gap-2 flex-col w-full relative">
    <div
      class="relative flex p-1 items-center w-full gap-1 whitespace-nowrap"
      data-tauri-drag-region
    >
      <UButton
        v-for="tab in tabs"
        :key="tab.id"
        variant="soft"
        color="neutral"
        active-color="primary"
        active-variant="solid"
        :active="activeTab === tab.id"
        :to="{ name: 'chat', params: { id: tab.id } }"
        >{{ tab.label }}
        <UButton
          class="-mr-1"
          icon="i-mdi-close"
          size="xs"
          color="neutral"
          variant="ghost"
          @click.stop.prevent="removeTab(tab.id)"
        />
      </UButton>
      <UButton
        icon="i-mdi-plus"
        size="sm"
        color="neutral"
        variant="subtle"
        @click="
          () => {
            const id = addTab();
            $router.push({ name: 'chat', params: { id } });
          }
        "
      />
      <div class="flex-1 min-h-full" />
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
