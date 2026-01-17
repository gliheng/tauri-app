<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { throttle } from "lodash-es";
import { getDocument, writeDocument, updateDocument } from "@/db-sqlite";

import { useTabsStore } from "@/stores/tabs";
import NameEdit from "@/components/NameEdit.vue";
import IconEdit from "@/components/IconEdit.vue";
import ChartCanvas from "@/components/ChartEditor/ChartCanvas.vue";
import DocumentsSlideover from "@/components/DocumentsSlideover.vue";

const tabsStore = useTabsStore();
const router = useRouter();
const route = useRoute();

const initialData = await getDocument(route.params.id as string);

const chart = ref({
  name: initialData?.name ?? 'New Chart',
  icon: initialData?.icon ?? 'i-lucide-git-branch',
  data: initialData?.type === 'chart' && initialData.data
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
    type: 'chart',
    name: chart.value.name,
    icon: chart.value.icon,
    data: JSON.stringify(chart.value.data),
  };

  if (!created) {
    await writeDocument({
      ...chartDataSave,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created = true;
  } else {
    await updateDocument(
      route.params.id as string,
      {
        ...chartDataSave,
        updatedAt: new Date(),
      },
    );
  }
}, 1000);

watch(chart, throttledWatcher, {
  deep: true,
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 relative">
    <div class="absolute top-2 right-2 z-10 flex flex-row gap-2">
      <DocumentsSlideover />
    </div>
    <hgroup class="flex flex-row gap-2 items-center m-4">
      <IconEdit v-model:icon="chart.icon" />
      <NameEdit v-model:name="chart.name" />
    </hgroup>
    <div class="flex-1 w-full">
      <ChartCanvas v-model="chart.data" />
    </div>
  </div>
</template>
