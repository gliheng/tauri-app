import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

export const useTabsStore = defineStore("tabs", () => {
  const router = useRouter();
  const tabs = ref<
    {
      id: string;
      label: string;
    }[]
  >(loadTabs());
  const activeTab = computed(() => {
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name === "chat") {
      return currentRoute.params.id as string;
    }
    return "";
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
      tabs.value.push({ id, label: "New chat" });
      saveTabs(tabs.value);
      return id;
    },
    removeTab(id: string) {
      const activeRemoved = activeTab.value === id;
      tabs.value = tabs.value.filter((tab) => tab.id !== id);
      if (tabs.value.length === 0) {
        tabs.value = [
          {
            id: nanoid(),
            label: "New chat",
          },
        ];
      }
      if (activeRemoved) {
        console.log("goto", tabs.value[0]?.id);
        router.push({ name: "chat", params: { id: tabs.value[0]?.id } });
      }
      saveTabs(tabs.value);
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
          id: lastChatId,
          label: "New chat",
        },
      ]
    : [];
}

function saveTabs(tabs: { id: string; label: string }[]) {
  sessionStorage.setItem("tabs", JSON.stringify(tabs));
}
