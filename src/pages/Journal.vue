<script setup lang="ts">
import { onActivated } from "vue";
import { useTabsStore } from "@/stores/tabs";
import JournalPage from "@/components/Journal/JournalPage.vue";

const tabsStore = useTabsStore();

onActivated(() => {
  tabsStore.openTab('/journal', 'Journal');
});
</script>

<template>
  <JournalPage />
</template>
