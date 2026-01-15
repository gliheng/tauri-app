<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { throttle } from "lodash-es";
import { getChart, writeChart, updateChart } from "@/db-sqlite";
import { useSidebarStore } from "@/stores/sidebar";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";
import ChartCanvas from "@/components/Chart/ChartCanvas.vue";

const sidebarStore = useSidebarStore();

const route = useRoute();

const initialData = await getChart(route.params.id as string);

const chart = ref({
  name: initialData?.name ?? 'New Chart',
  icon: initialData?.icon ?? 'i-lucide-git-branch',
  data: initialData?.data
    ? JSON.parse(initialData.data)
    : {
      nodes: [],
      edges: [],
    },
});

let created = !!initialData;

const throttledWatcher = throttle(async () => {
  const chartDataSave = {
    id: route.params.id as string,
    name: chart.value.name,
    icon: chart.value.icon,
    data: JSON.stringify(chart.value.data),
  };

  if (!created) {
    await writeChart({
      ...chartDataSave,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created = true;
  } else {
    await updateChart(
      route.params.id as string,
      {
        ...chartDataSave,
        updatedAt: new Date(),
      },
    );
  }
  sidebarStore.loadCharts();
}, 1000);

watch(chart, throttledWatcher, {
  deep: true,
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 relative">
    <hgroup class="flex flex-row gap-2 items-center mx-4 mt-4">
      <IconEdit v-model:icon="chart.icon" />
      <NameEdit v-model:name="chart.name" />
    </hgroup>
    <div class="flex-1 w-full">
      <ChartCanvas v-model="chart.data" />
    </div>
  </div>
</template>
