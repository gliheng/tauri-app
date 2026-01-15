<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { throttle } from "lodash-es";
import { getChart, writeChart, updateChart } from "@/db-sqlite";
import { useChartsStore } from "@/stores/charts";
import { useTabsStore } from "@/stores/tabs";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";
import ChartCanvas from "@/components/Chart/ChartCanvas.vue";
import NavigationSlideover from "@/components/NavigationSlideover.vue";

const chartsStore = useChartsStore();
const tabsStore = useTabsStore();
const router = useRouter();

const route = useRoute();

chartsStore.loadCharts();

const chartItems = computed(() => {
  return chartsStore.charts.map((chart) => ({
    name: chart.name,
    icon: chart.icon,
    onClick: () => {
      tabsStore.openTab(`/chart/${chart.id}`, chart.name);
      router.push({
        name: "chart",
        params: { id: chart.id },
      });
    },
  }));
});

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
  chartsStore.loadCharts();
}, 1000);

watch(chart, throttledWatcher, {
  deep: true,
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 relative">
    <div class="absolute top-4 left-4 z-10">
      <NavigationSlideover
        title="Charts"
        :items="chartItems"
      />
    </div>
    <hgroup class="flex flex-row gap-2 items-center mx-4 mt-4">
      <IconEdit v-model:icon="chart.icon" />
      <NameEdit v-model:name="chart.name" />
    </hgroup>
    <div class="flex-1 w-full">
      <ChartCanvas v-model="chart.data" />
    </div>
  </div>
</template>
