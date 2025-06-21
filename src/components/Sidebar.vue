<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTabsStore } from "@/stores/tabs";
import { nanoid } from "nanoid";

const tabsStore = useTabsStore();
const router = useRouter();

function addChat() {
  const id = nanoid();
  tabsStore.openTab(`/chat/${id}`, "New chat");
  router.push({
    name: "chat",
    params: { id },
  });
}

function addAgent() {
  const id = nanoid();
  tabsStore.openTab(`/agent/${id}`, "New agent");
  router.push({
    name: "agent",
    params: {
      id,
    },
  });
}
function addLibrary() {
  const id = nanoid();
  tabsStore.openTab(`/library/${id}`, "New library");
  router.push({
    name: "library",
    params: {
      id,
    },
  });
}
</script>

<template>
  <aside
    class="flex-1 size-full bg-elevated flex flex-col p-2 gap-2 items-stretch"
  >
    <h1 class="text-xl font-bold mb-2 flex flex-row gap-2 items-center">
      <img class="w-10 h-10" src="/Untitled6.jpg" alt="Logo" />
      Raven
    </h1>
    <UButton
      icon="i-lucide-message-circle"
      variant="subtle"
      color="neutral"
      @click="addChat"
      >New Chat</UButton
    >
    <UCollapsible class="flex flex-col gap-2" default-open>
      <UButton
        class="group"
        icon="i-lucide-brain"
        variant="subtle"
        color="neutral"
        trailing-icon="i-lucide-chevron-down"
        :ui="{
          trailingIcon:
            'group-data-[state=open]:rotate-180 transition-transform duration-200',
        }"
        block
        >Agent</UButton
      >
      <template #content>
        <section class="ps-4">
          <UButton
            class="items-start p-0"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            @click="addAgent"
            >Add</UButton
          >
        </section>
      </template>
    </UCollapsible>
    <UCollapsible class="flex flex-col gap-2" default-open>
      <UButton
        class="group"
        icon="i-lucide-library"
        variant="subtle"
        color="neutral"
        :ui="{
          trailingIcon:
            'group-data-[state=open]:rotate-180 transition-transform duration-200',
        }"
        trailing-icon="i-lucide-chevron-down"
        default-open
        block
      >
        Library
      </UButton>
      <template #content>
        <section class="ps-4">
          <UButton
            class="items-start p-0"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            @click="addLibrary"
            >Add</UButton
          >
        </section>
      </template>
    </UCollapsible>
  </aside>
</template>
