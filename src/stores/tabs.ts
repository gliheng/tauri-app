import { ref } from "vue";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";
import { nanoid } from "nanoid";

export const useTabsStore = defineStore("tabs", () => {
  const router = useRouter();
  const tabs = ref<
    {
      path: string;
      title: string;
    }[]
  >(loadTabs());
  const showArtifactView = ref(false);

  const openTab = (path: string, title: string) => {
    if (tabs.value.some((tab) => tab.path === path)) {
      return;
    }
    tabs.value.push({ path, title });
    saveTabs(tabs.value);
  };

  const closeTab = (path: string) => {
    const activeRemoved = router.currentRoute.value.path === path;
    tabs.value = tabs.value.filter((tab) => tab.path !== path);
    if (tabs.value.length === 0) {
      tabs.value = [
        {
          path: `/chat/${nanoid()}`,
          title: "New chat",
        },
      ];
    }
    if (activeRemoved) {
      const firstTab = tabs.value[0];
      if (firstTab) {
        router.push({ path: firstTab.path });
      }
    }
    saveTabs(tabs.value);
  };

  const closeActiveTab = () => {
    const path = router.currentRoute.value.path;
    closeTab(path);
  };

  const reorderTab = (from: number, to: number) => {
    const removed = tabs.value.splice(from, 1)[0];
    tabs.value.splice(to, 0, removed);
    saveTabs(tabs.value);
  };

  const setTitle = (path: string, topic: string) => {
    const tab = tabs.value.find((tab) => tab.path === path);
    if (tab) {
      tab.title = topic;
      saveTabs(tabs.value);
    }
  };

  const toggleArtifactView = () => {
    showArtifactView.value = !showArtifactView.value;
  };

  return {
    tabs,
    openTab,
    closeActiveTab,
    closeTab,
    reorderTab,
    setTitle,
    showArtifactView,
    toggleArtifactView,
  };
});

function loadTabs() {
  const storedTabs = sessionStorage.getItem("tabs");
  if (storedTabs) {
    return JSON.parse(storedTabs);
  }
  const lastChatId = sessionStorage.getItem("lastChatId");
  return lastChatId
    ? [
        {
          path: `/chat/${lastChatId}`,
          title: "New chat",
        },
      ]
    : [];
}

function saveTabs(tabs: { path: string; title: string }[]) {
  sessionStorage.setItem("tabs", JSON.stringify(tabs));
}
