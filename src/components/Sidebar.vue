<script setup lang="ts">
import { useRouter } from "vue-router";
import { nanoid } from "nanoid";
import { tv } from "tailwind-variants";
import { useColorMode } from "@vueuse/core";
import { useTabsStore } from "@/stores/tabs";
import { useSidebarStore } from "@/stores/sidebar";
import { Agent, Document, writeAgent, writeDocument, Note, Chart } from "@/db-sqlite";
import { computed } from "vue";
import AgentConfig from "./AgentChat/AgentConfig.vue";
import DocumentConfig from "./DocumentConfig.vue";
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
const documentCreateModal = overlay.create(DocumentConfig);

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

function openAgent(agent: Agent) {
  tabsStore.openTab(agentUrl(agent), agent.name);
  router.push({
    name: "agent",
    params: {
      id: agent.id,
    },
  });
}

function documentUrl(type: "note" | "chart", id: string) {
  return `/${type}/${id}`;
}

function goToDocuments() {
  tabsStore.openTab('/documents', 'Documents');
  router.push({ name: 'documents' });
}

async function addDocument() {
  const type = await documentCreateModal.open() as "note" | "chart" | null;
  if (!type) {
    return;
  }

  const id = nanoid();
  const name = type === 'note' ? 'New Note' : 'New Chart';
  tabsStore.openTab(documentUrl(type, id), name);
  router.push({
    name: type,
    params: {
      id,
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
      <UTooltip text="New Chat" :content="{
        side: 'right',
      }">
        <UButton
          :label="collapsed ? undefined : 'New Chat'"
          icon="i-lucide-message-circle"
          variant="subtle"
          color="neutral"
          @click="addChat"
        />
      </UTooltip>

      <UCollapsible class="flex flex-col gap-2" default-open>
        <UTooltip text="Agent" :content="{
          side: 'right',
        }">
          <UButton
            :label="collapsed ? undefined : 'Agent'"
            :icon="collapsed ? undefined : 'i-lucide-brain'"
            class="group"
            variant="subtle"
            color="neutral"
            trailing-icon="i-lucide-chevron-down"
            block
            :ui="{
              trailingIcon:
                'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
          />
        </UTooltip>
        <template #content>
          <section class="space-y-1">
            <UTooltip
              v-for="agent in sidebarStore.agents"
              :key="agent.id"
              :text="agent.name"
              :content="{
                side: 'right',
              }"
            >
              <UButton
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
            </UTooltip>
            <UTooltip text="Add Agent" :content="{
              side: 'right',
            }">
              <UButton
                class="w-full"
                :label="collapsed ? undefined : 'Add'"
                icon="i-lucide-plus"
                color="neutral"
                variant="soft"
                @click="addAgent"
              />
            </UTooltip>
          </section>
        </template>
      </UCollapsible>

      <UTooltip text="Create Document" :content="{
        side: 'right',
      }">
        <UButton
          :label="collapsed ? undefined : 'Document'"
          icon="i-lucide-file-text"
          variant="subtle"
          color="neutral"
          @click="goToDocuments"
        />
      </UTooltip>

      <UTooltip text="Generate Image with AI" :content="{
        side: 'right',
      }">
        <UButton
          :label="collapsed ? undefined : 'Image'"
          icon="i-lucide-image"
          variant="subtle"
          color="neutral"
          @click="addImage"
        />
      </UTooltip>
    </template>

    <template #footer="{ collapsed }">
      <UModal
        :ui="{
          content: 'w-[720px] max-w-[720px] h-[70dvh]',
        }"
      >
        <UTooltip text="Settings" :content="{
          side: 'right',
        }">
          <UButton
            icon="i-mdi-cog"
            color="neutral"
            :label="collapsed ? undefined : 'Settings'"
            variant="subtle"
            block
          />
        </UTooltip>
        <template #content>
          <Settings />
        </template>
      </UModal>
    </template>
  </UDashboardSidebar>
</template>
