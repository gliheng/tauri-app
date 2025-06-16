<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import { getAllChats, Chat } from "@/db";
import { useTabsStore } from "@/stores/tabs";

const toast = useToast();
const list = await getAllChats();
const chatList = ref<Chat[]>(list);
const { openTab } = useTabsStore();
const router = useRouter();

const emit = defineEmits<{
  close: void;
}>();

const groups = computed(() => [
  {
    id: "chat-sessions",
    label: "Chat Sessions",
    items: chatList.value.map((e) => ({
      id: e.id,
      label: e.topic,
      icon: "i-lucide-message-circle",
      suffix: moment(e.updatedAt).fromNow(),
    })),
  },
  {
    id: "actions",
    items: [
      {
        label: "Add new file",
        suffix: "Create a new file in the current directory or workspace.",
        icon: "i-lucide-file-plus",
        kbds: ["meta", "N"],
        onSelect() {
          toast.add({ title: "Add new file" });
        },
      },
      {
        label: "Add new folder",
        suffix: "Create a new folder in the current directory or workspace.",
        icon: "i-lucide-folder-plus",
        kbds: ["meta", "F"],
        onSelect() {
          toast.add({ title: "Add new folder" });
        },
      },
      {
        label: "Add hashtag",
        suffix: "Add a hashtag to the current item.",
        icon: "i-lucide-hash",
        kbds: ["meta", "H"],
        onSelect() {
          toast.add({ title: "Add hashtag" });
        },
      },
      {
        label: "Add label",
        suffix: "Add a label to the current item.",
        icon: "i-lucide-tag",
        kbds: ["meta", "L"],
        onSelect() {
          toast.add({ title: "Add label" });
        },
      },
    ],
  },
]);

function onSelect(item: any) {
  openTab(item.id, item.label);
  router.push({ name: "chat", params: { id: item.id } });
  emit("close");
}
</script>

<template>
  <UCommandPalette
    class="flex-1 h-80"
    :groups="groups"
    @update:model-value="onSelect"
  />
</template>
