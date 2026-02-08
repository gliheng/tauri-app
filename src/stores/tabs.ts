import { ref } from "vue";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import { getCurrentWindow } from '@tauri-apps/api/window';

export const useTabsStore = defineStore("tabs", () => {
  const router = useRouter();
  const tabs = ref<
    {
      path: string;
      title: string;
      showNotification?: boolean;
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
    // Find the index before filtering
    const removedIndex = tabs.value.findIndex((tab) => tab.path === path);
    const activeRemoved = router.currentRoute.value.path === path;

    tabs.value = tabs.value.filter((tab) => tab.path !== path);
    if (tabs.value.length === 0) {
      const appWindow = getCurrentWindow();
      appWindow.hide();
      tabs.value = [
        {
          path: `/chat/${nanoid()}`,
          title: "New chat",
        },
      ];
    }
    if (activeRemoved) {
      // Activate the nearest tab (prefer the one before, otherwise the one after)
      const targetIndex = Math.min(removedIndex, tabs.value.length - 1);
      const targetTab = tabs.value[targetIndex];
      if (targetTab) {
        router.push({ path: targetTab.path });
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

  const setNotification = (path: string, show: boolean) => {
    const tab = tabs.value.find((tab) => tab.path === path);
    if (tab) {
      tab.showNotification = show;
      saveTabs(tabs.value);
    }
  };

  const toggleArtifactView = () => {
    showArtifactView.value = !showArtifactView.value;
  };

  const createNewChat = () => {
    const id = nanoid();
    openTab(`/chat/${id}`, "New chat");
    router.push({ name: "chat", params: { id } });
  };

  return {
    tabs,
    openTab,
    closeActiveTab,
    closeTab,
    reorderTab,
    setTitle,
    setNotification,
    createNewChat,
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
