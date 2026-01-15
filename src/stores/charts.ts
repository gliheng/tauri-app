import { ref } from "vue";
import { defineStore } from "pinia";
import { Chart, getCharts } from "@/db-sqlite";

export const useChartsStore = defineStore("charts", () => {
  async function loadCharts() {
    charts.value = await getCharts();
  }

  const charts = ref<Chart[]>([]);

  return {
    charts,
    loadCharts,
  };
});
