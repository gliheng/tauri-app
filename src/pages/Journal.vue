<script setup lang="ts">
import { onMounted } from "vue";
import { useTabsStore } from "@/stores/tabs";
import JournalPage from "@/components/Journal/JournalPage.vue";

const tabsStore = useTabsStore();

onMounted(() => {
  tabsStore.openTab('/journal', 'Journal');
});
</script>

<template>
  <JournalPage />
</template>
