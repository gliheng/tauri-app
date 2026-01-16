<script setup lang="ts">
import { useRouter } from "vue-router";
import { nanoid } from "nanoid";
import { tv } from "tailwind-variants";
import { useColorMode } from "@vueuse/core";
import { useTabsStore } from "@/stores/tabs";
import { useSidebarStore } from "@/stores/sidebar";
import { Agent, Note, Chart, writeAgent } from "@/db-sqlite";
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
  return mode.value === "dark" ? "/raven-light.png" : "/raven-dark.png";
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

function addImage() {
  tabsStore.openTab(`/image`, "Image Generation");
  router.push({
    name: "image",
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

function chartUrl(chart: Chart) {
  return `/chart/${chart.id}`;
}

function addChart() {
  const id = nanoid();
  tabsStore.openTab(`/chart/${id}`, "New chart");
  router.push({
    name: "chart",
    params: {
      id,
    },
  });
}

function openChart(chart: Chart) {
  tabsStore.openTab(`/chart/${chart.id}`, chart.name);
  router.push({
    name: "chart",
    params: {
      id: chart.id,
    },
  });
}

const platform = navigator.platform;
const isMac = platform.startsWith("Mac");</script>

<template>
  <UDashboardSidebar
    resizable
    collapsible
    :default-size="20"
    :min-size="10"
    :max-size="30"
    :ui="{
      root: 'bg-elevated',
      body: 'gap-2',
    }"
  >
    <template #header="{ collapsed }">
      <h1
        class="text-3xl font-bold flex flex-row gap-4 items-center justify-center"
        :class="{ 'pt-8': isMac }"
        data-tauri-drag-region
      >
        <img
          v-if="!collapsed"
          class="w-40 h-10 pointer-events-none object-contain"
          :src="logoImg"
          alt="Logo"
        />
        <UIcon
          v-else
          name="i-lucide-message-circle"
          class="size-8 mx-auto text-primary"
        />
      </h1>
    </template>

    <template #default="{ collapsed }">
      <UButton
        :label="collapsed ? undefined : 'New Chat'"
        :square="collapsed"
        icon="i-lucide-message-circle"
        variant="subtle"
        color="neutral"
        @click="addChat"
      />

      <UCollapsible class="flex flex-col gap-2" default-open>
        <UButton
          :icon="collapsed ? undefined : 'i-lucide-brain'"
          :label="collapsed ? undefined : 'Agent'"
          class="group"
          variant="subtle"
          color="neutral"
          trailing-icon="i-lucide-chevron-down"
          block
          :ui="{
            trailingIcon:
              'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
          :square="collapsed"
        />
        <template #content>
          <section class="space-y-1">
            <UButton
              v-for="agent in sidebarStore.agents"
              :key="agent.id"
              :icon="agent.icon"
              :label="collapsed ? undefined : agent.name"
              :class="buttonStyle({})"
              color="neutral"
              variant="soft"
              active-color="primary"
              active-variant="solid"
              :active="$route.path === agentUrl(agent)"
              @click="openAgent(agent)"
            />
            <UButton
              :label="collapsed ? undefined : 'Add'"
              :square="collapsed"
              class="w-full"
              icon="i-lucide-plus"
              color="neutral"
              variant="soft"
              @click="addAgent"
            />
          </section>
        </template>
      </UCollapsible>

      <UButton
        :label="collapsed ? undefined : 'Note'"
        icon="i-lucide-notebook-text"
        variant="subtle"
        color="neutral"
        @click="addNote"
      />

      <UButton
        :label="collapsed ? undefined : 'Chart'"
        icon="i-lucide-git-compare"
        variant="subtle"
        color="neutral"
        @click="addChart"
      />

      <UButton
        :label="collapsed ? undefined : 'Create image'"
        icon="i-lucide-image"
        variant="subtle"
        color="neutral"
        @click="addImage"
      />
    </template>

    <template #footer="{ collapsed }">
      <UModal
        :ui="{
          content: 'w-[720px] max-w-[720px] h-[70dvh]',
        }"
      >
        <UButton
          icon="i-mdi-cog"
          :label="collapsed ? undefined : 'Settings'"
          color="neutral"
          variant="subtle"
          block
          :square="collapsed"
        />
        <template #content>
          <Settings />
        </template>
      </UModal>
    </template>
  </UDashboardSidebar>
</template>
