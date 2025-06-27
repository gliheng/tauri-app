<script setup lang="ts">
import { useRouter } from "vue-router";
import { nanoid } from "nanoid";
import { useTabsStore } from "@/stores/tabs";
import { useSidebarStore } from "@/stores/sidebar";
import { Agent, Library } from "@/db";
import { tv } from "tailwind-variants";

const buttonStyle = tv({
  base: "items-center w-full h-10",
});

const router = useRouter();
const tabsStore = useTabsStore();
const sidebarStore = useSidebarStore();

sidebarStore.load();

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

function openAgent(agent: Agent) {
  tabsStore.openTab(`/agent/${agent.id}`, agent.name);
  router.push({
    name: "agent",
    params: {
      id: agent.id,
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

function openLibrary(library: Library) {
  tabsStore.openTab(`/library/${library.id}`, library.name);
  router.push({
    name: "library",
    params: {
      id: library.id,
    },
  });
}
</script>

<template>
  <aside
    class="flex-1 size-full bg-elevated flex flex-col p-2 gap-2 items-stretch"
  >
    <h1 class="text-xl font-bold mb-2 flex flex-row gap-2 items-center">
      <img class="w-16 h-16" src="/Untitled6.png" alt="Logo" />
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
        <section>
          <UButton
            v-for="agent in sidebarStore.agents"
            :key="agent.id"
            :class="buttonStyle({})"
            :icon="agent.icon"
            color="neutral"
            variant="soft"
            @click="openAgent(agent)"
            >{{ agent.name }}</UButton
          >
          <UButton
            :class="buttonStyle({})"
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
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
        <section>
          <UButton
            :class="buttonStyle({})"
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
            @click="addLibrary"
            >Add</UButton
          >
        </section>
      </template>
    </UCollapsible>
  </aside>
</template>
