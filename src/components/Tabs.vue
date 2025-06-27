<script setup lang="ts">
import { useTabsStore } from "@/stores/tabs";
import { nanoid } from "nanoid";
import { storeToRefs } from "pinia";

const store = useTabsStore();
const { closeTab, openTab } = store;
const { tabs } = storeToRefs(store);
</script>

<template>
  <div class="flex items-center gap-2 flex-col w-full relative">
    <div
      class="relative flex p-1 items-center w-full gap-1 whitespace-nowrap"
      data-tauri-drag-region
    >
      <UButton
        v-for="tab in tabs"
        :key="tab.path"
        class="max-w-40"
        variant="soft"
        color="neutral"
        active-color="primary"
        active-variant="solid"
        :active="$route.path === tab.path"
        :to="{ path: tab.path }"
        ><span class="block overflow-hidden text-ellipsis">{{
          tab.title
        }}</span>
        <UButton
          slot="trailing"
          class="-mr-1 -my-1"
          icon="i-mdi-close"
          size="xs"
          color="neutral"
          variant="ghost"
          @click.stop.prevent="closeTab(tab.path)"
        />
      </UButton>
      <UButton
        icon="i-mdi-plus"
        size="sm"
        color="neutral"
        variant="subtle"
        @click="
          () => {
            const id = nanoid();
            openTab(`/chat/${id}`, 'New chat');
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
