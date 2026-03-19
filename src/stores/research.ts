import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  deleteResearchTopic as dbDeleteResearchTopic,
  getResearchTopics,
  type ResearchTopic,
} from "@/db";

export const useResearchStore = defineStore("research", () => {
  const topics = ref<ResearchTopic[]>([]);

  async function loadTopics(): Promise<void> {
    topics.value = await getResearchTopics();
  }

  async function deleteTopic(id: string): Promise<void> {
    await dbDeleteResearchTopic(id);
    topics.value = topics.value.filter(topic => topic.id !== id);
  }

  const topicCount = computed(() => topics.value.length);

  return {
    topics,
    topicCount,
    loadTopics,
    deleteTopic,
  };
});
