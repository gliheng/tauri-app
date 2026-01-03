<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAgent, updateAgent, deleteAgent } from '@/db';
import { useSidebarStore } from '@/stores/sidebar';
import { useTabsStore } from '@/stores/tabs';
import { AnimatePresence, motion } from 'motion-v';
import { nanoid } from "nanoid";
import { getModelConfig } from "@/llm";
import { ACPService } from "@/services/acp";
import AgentSessionList from "@/components/AgentSessionList.vue";
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';


const route = useRoute();
const router = useRouter();
const agent = await getAgent(route.params.id as string);
if (!agent) throw new Error('Agent does not exist');

const sidebarStore = useSidebarStore();
const tabsStore = useTabsStore();

const name = ref(agent.name);
const icon = ref(agent.icon);

// Watch for name and icon changes and update agent
watch([name, icon], async ([newName, newIcon]) => {
  if (agent && (newName !== agent.name || newIcon !== agent.icon)) {
    try {
      await updateAgent(agent.id, {
        name: newName,
        icon: newIcon
      });
      sidebarStore.loadAgents();
      if (newName) {
        tabsStore.setTitle(`/agent/${agent.id}`, newName);
      }
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  }
});

function onChat() {
  const id = nanoid();
  sessionStorage.setItem('chat-agent::' + id, agent!.id);
  tabsStore.openTab(`/chat/${id}`, "New agent chat");
  router.push({
    name: 'chat',
    params: {
      id,
    },
  });
}

async function onDelete() {
  const ok = await confirm(`Are you sure you want to delete "${agent!.name}"? This will also delete all associated chats.`, {
    title: 'Delete Agent',
    kind: 'warning'
  });
  
  if (ok) {
    try {
      await deleteAgent(agent!.id);
      sidebarStore.loadAgents();
      tabsStore.closeTab(`/agent/${agent!.id}`);
      router.push('/');
    } catch (error) {
      console.error('Failed to delete agent:', error);
      await message('Failed to delete agent. Please try again.', {
        title: 'Error',
        kind: 'error'
      });
    }
  }
}

async function openDirectory() {
  if (agent?.directory) {
    try {
      await openPath(agent.directory);
    } catch (error) {
      console.error('Failed to open directory:', error);
      await message('Failed to open directory. Please check if the path exists.', {
        title: 'Error',
        kind: 'error'
      });
    }
  }
}

const enableLoadSession = ref(false);
onMounted(async () => {
  const { model, apiKey, baseUrl } = getModelConfig();
  const acpService = new ACPService({ 
    program: agent.program!,
    directory: agent.directory!,
    mcpServers: [],
    model: {
      model,
      baseUrl,
      apiKey,
    },
    onConnect() {
      console.log('onConnect');
    },
    onDisconnect() {
      console.log('onDisconnect');
    },
    async onInvoke(method, params) {
      console.log("Method", method, "invoked with params", params);
    },
  });
  await acpService.initialize();
  enableLoadSession.value = acpService.hasCapability("loadSession");
  await acpService.dispose();
});
</script>

<template>
  <div class="size-full p-4 flex flex-col relative overflow-y-auto"
    :class="enableLoadSession ? 'justify-start' : 'justify-center'"
  >
    <!-- Hover menu in top-right corner -->
    <div class="absolute top-4 right-4 z-10">
      <UDropdownMenu :items="[[
        {
          label: 'Delete Agent',
          icon: 'i-lucide-trash-2',
          color: 'error',
          onSelect: onDelete
        }
      ]]">
        <UButton
          icon="i-heroicons-ellipsis-vertical"
          color="neutral"
          variant="outline"
          size="sm"
        />
      </UDropdownMenu>
    </div>

    <!-- Agent header section -->
    <div class="flex flex-row gap-2 px-4 sticky top-0 rounded bg-zinc-100">
      <div
        class="flex flex-col items-center justify-center py-8 flex-1"
      >
        <hgroup class="flex flex-row gap-2 mb-6">
          <IconEdit v-model:icon="icon" />
          <NameEdit v-model:name="name" />
        </hgroup>
        <div class="flex mt-6 justify-center">
          <UButton
            class="text-xl px-8 py-4"
            color="primary"
            size="xl"
            icon="i-heroicons-chat-bubble-bottom-center-text"
            @click="onChat"
          >Chat</UButton>
        </div>
      </div>
      <div class="flex-2 py-8">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Agent Details</h3>
          </template>
          
          <div class="space-y-3">
            <div class="flex items-start">
              <span class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Type:</span>
              <span class="font-medium">{{ agent.type }}</span>
            </div>
            
            <div v-if="agent.program" class="flex items-start">
              <span class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Program:</span>
              <span class="font-medium">{{ agent.program }}</span>
            </div>
            
            <div v-if="agent.directory" class="flex items-start">
              <span class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Directory:</span>
              <div class="flex items-center gap-2">
                <span class="font-medium break-all">{{ agent.directory }}</span>
                <UButton
                  icon="i-lucide-folder-open"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="openDirectory"
                  title="Open directory"
                />
              </div>
            </div>
            
            <div v-if="agent.instructions" class="flex items-start">
              <span class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Instructions:</span>
              <span class="whitespace-pre-wrap">{{ agent.instructions }}</span>
            </div>
            
            <div class="flex items-start">
              <span class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Created:</span>
              <span class="font-medium">{{ new Date(agent.createdAt).toLocaleString() }}</span>
            </div>
            
            <div class="flex items-start">
              <span class="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Updated:</span>
              <span class="font-medium">{{ new Date(agent.updatedAt).toLocaleString() }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Sessions grid below -->
    <AnimatePresence>
      <motion.div v-if="enableLoadSession">
        <AgentSessionList :agent-id="agent.id" />
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<style lang="scss" scoped>
</style>