<script setup lang="ts">
import { onActivated } from 'vue';
import { useTabsStore } from '@/stores/tabs';

const tabsStore = useTabsStore();
onActivated(() => {
  tabsStore.openTab('/test-editor', "Test editor");
});
</script>

<template>
  <div class="h-full">
    <Suspense>
      <WorkspaceEditor cwd="/Users/juju/Develop/tauri-app" />
      <template #fallback>
        <div class="h-30 flex items-center justify-center">
          <Spinner />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<style lang="scss" scoped>
</style>