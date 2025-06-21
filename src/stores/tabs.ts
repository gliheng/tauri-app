import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

export const useTabsStore = defineStore("tabs", () => {
  const router = useRouter();
  const tabs = ref<
    {
      name: string;
      id: string;
      label: string;
    }[]
  >(loadTabs());
  const activeTab = computed(() => {
    const currentRoute = router.currentRoute.value;
    return (currentRoute.params.id as string) ?? "";
  });
  const expanded = ref(false);
  return {
    expanded,
    toggleExpanded() {
      expanded.value = !expanded.value;
    },
    tabs,
    activeTab,
    addTab() {
      const id = nanoid();
      tabs.value.push({ name: "chat", id, label: "New chat" });
      saveTabs(tabs.value);
      return id;
    },
    openTab(name: string, id: string, title: string) {
      if (tabs.value.some((tab) => tab.id === id)) {
        return;
      }
      tabs.value.push({ name, id, label: title });
      saveTabs(tabs.value);
    },
    closeActiveTab() {
      const id = activeTab.value;
      if (!id) return;
      this.closeTab(id);
    },
    closeTab(id: string) {
      const activeRemoved = activeTab.value === id;
      tabs.value = tabs.value.filter((tab) => tab.id !== id);
      if (tabs.value.length === 0) {
        tabs.value = [
          {
            name: "chat",
            id: nanoid(),
            label: "New chat",
          },
        ];
      }
      if (activeRemoved) {
        const firstTab = tabs.value[0];
        if (firstTab) {
          debugger;
          router.push({ name: firstTab.name, params: { id: firstTab.id } });
        }
      }
      saveTabs(tabs.value);
    },
    setTitle(id: string, topic: string) {
      const tab = tabs.value.find((tab) => tab.id === id);
      if (tab) {
        tab.label = topic;
        saveTabs(tabs.value);
      }
    },
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
          name: "chat",
          id: lastChatId,
          label: "New chat",
        },
      ]
    : [];
}

function saveTabs(tabs: { id: string; label: string }[]) {
  sessionStorage.setItem("tabs", JSON.stringify(tabs));
}
