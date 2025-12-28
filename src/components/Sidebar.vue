<script setup lang="ts">
import { useRouter } from "vue-router";
import { nanoid } from "nanoid";
import { tv } from "tailwind-variants";
import { useColorMode } from "@vueuse/core";
import { useTabsStore } from "@/stores/tabs";
import { useSidebarStore } from "@/stores/sidebar";
import { Agent, Note, writeAgent } from "@/db";
import { computed } from "vue";
import AgentConfig from "./AgentChat/AgentConfig.vue";
import type { AgentFormData } from "./AgentChat/AgentConfig.vue";

const buttonStyle = tv({
  base: "items-center w-full",
});

const router = useRouter();
const tabsStore = useTabsStore();
const sidebarStore = useSidebarStore();
const mode = useColorMode();

const logoImg = computed(() => {
  return mode.value === "dark" ? "/raven-dark.png" : "/raven-light.png";
});

sidebarStore.load();

function addChat() {
  const id = nanoid();
  tabsStore.openTab(`/chat/${id}`, "New chat");
  router.push({
    name: "chat",
    params: { id },
  });
}

const overlay = useOverlay();
const agentCreateModal = overlay.create(AgentConfig);

async function addAgent() {
  const agent = await agentCreateModal.open() as AgentFormData | null;
  if (!agent) {
    return;
  }

  const id = nanoid();
  const fullAgent: Agent = {
    ...agent,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await writeAgent(fullAgent);
  sidebarStore.loadAgents();

  tabsStore.openTab(`/agent/${id}`, agent.name);
  router.push({
    name: "agent",
    params: {
      id,
    },
  });
}

function agentUrl(agent: Agent) {
  return `/agent/${agent.id}`;
}

function noteUrl(note: Note) {
  return `/note/${note.id}`;
}

function openAgent(agent: Agent) {
  tabsStore.openTab(agentUrl(agent), agent.name);
  router.push({
    name: "agent",
    params: {
      id: agent.id,
    },
  });
}

function addNote() {
  const id = nanoid();
  tabsStore.openTab(`/note/${id}`, "New note");
  router.push({
    name: "note",
    params: {
      id,
    },
  });
}

function openNote(note: Note) {
  tabsStore.openTab(`/note/${note.id}`, note.name);
  router.push({
    name: "note",
    params: {
      id: note.id,
    },
  });
}

const platform = navigator.platform;
const isMac = platform.startsWith("Mac");
</script>

<template>
  <aside
    class="bg-elevated flex flex-col p-2 gap-2 items-stretch"
  >
    <h1 class="text-xl font-bold mb-2 flex flex-row gap-2 items-center justify-center"
      :class="{ 'pt-8': isMac }"
      data-tauri-drag-region
    >
      <img class="w-16 h-16 pointer-events-none" :src="logoImg" alt="Logo" />
      <span class="-ml-2 pointer-events-none">Raven</span>
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
        <section class="space-y-1">
          <UButton
            v-for="agent in sidebarStore.agents"
            :key="agent.id"
            :class="buttonStyle({})"
            :icon="agent.icon"
            color="neutral"
            variant="soft"
            active-color="primary"
            active-variant="solid"
            :active="$route.path === agentUrl(agent)"
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
        icon="i-lucide-notebook-text"
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
        Note
      </UButton>
      <template #content>
        <section class="space-y-1">
          <UButton
            v-for="note in sidebarStore.notes"
            :key="note.id"
            :class="buttonStyle({})"
            :icon="note.icon"
            color="neutral"
            variant="soft"
            active-color="primary"
            active-variant="solid"
            :active="$route.path === noteUrl(note)"
            @click="openNote(note)"
            >{{ note.name }}</UButton
          >
          <UButton
            :class="buttonStyle({})"
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
            @click="addNote"
            >Add</UButton
          >
        </section>
      </template>
    </UCollapsible>
    <div class="flex-1"></div>
    <UModal
      class=""
      :ui="{
        content: 'min-w-[600px] min-h-[400px]',
      }"
    >
      <UButton
        icon="i-mdi-cog"
        color="neutral"
        variant="subtle"
        label="Settings"
      />
      <template #content>
        <Settings />
      </template>
    </UModal>
  </aside>
</template>
