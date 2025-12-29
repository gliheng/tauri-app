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

function onLaunch() {
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

const enableLoadSession = ref(false);
onMounted(async () => {
  const { model, apiKey, baseUrl } = getModelConfig();
  const acpService = new ACPService({ 
    program: agent.program!,
    directory: agent.directory!,
    mcpServers: [],
    model,
    baseUrl,
    apiKey,
    onConnect() {
      console.log('onConnect');
    },
    onDisconnect() {
      console.log('onDisconnect');
    },
    onInvoke(method, params) {
      console.log("Method", method, "invoked with params", params);
    },
  });
  await acpService.initialize();
  enableLoadSession.value = acpService.hasCapability("loadSession");
  await acpService.dispose();
});
</script>

<template>
  <div class="size-full p-4 flex flex-row">
    <div class="flex flex-col items-center justify-center flex-1">
      <hgroup class="flex flex-row gap-2 mb-6">
        <IconEdit v-model:icon="icon" />
        <NameEdit v-model:name="name" />
      </hgroup>
      <div class="flex mt-6 justify-center gap-4">
        <UButton
          class="text-xl px-8 py-4"
          color="primary"
          size="xl"
          icon="i-lucide-rocket"
          @click="onLaunch"
        >Launch</UButton>
        <UButton
          class="text-xl px-8 py-4"
          color="error"
          size="xl"
          icon="i-lucide-trash-2"
          @click="onDelete"
        >Delete</UButton>
      </div>
    </div>
    <div class="flex-1">
      <AnimatePresence>
        <motion.div v-if="enableLoadSession" class="flex items-center gap-2">
          <AgentSessionList :agent-id="agent.id" />
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>