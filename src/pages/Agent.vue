<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getAgent, type Agent, getAgentSessions, type AgentSession, writeAgentSession, deleteAgentSession } from "@/db";
import AgentConfig from "@/components/AgentConfig.vue";

const route = useRoute();
const agentId = route.params.id as string;
const initialData = await getAgent(agentId);
const agent = ref<Agent>({
  id: agentId,
  name: initialData?.name ?? "New Agent",
  icon: initialData?.icon ?? "i-lucide-sticky-note",
  type: initialData?.type ?? "chat",
  instructions: initialData?.instructions,
  directory: initialData?.directory,
  program: initialData?.program ?? "codex",
  createdAt: initialData?.createdAt ?? new Date(),
  updatedAt: initialData?.updatedAt ?? new Date(),
});
const showConfig = ref(initialData ? false : true);

const updateAgent = (newAgentData: Partial<Agent>) => {
  agent.value = { ...agent.value, ...newAgentData };
};

const launchAgent = async () => {
  showConfig.value = false;
}

const currentSessionId = ref<string>();
const sessions = ref<AgentSession[]>(await getAgentSessions(agentId));

const loadSessions = async () => {
  try {
    sessions.value = await getAgentSessions(agentId);
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
};

const onNewSession = async () => {
  const newSession: AgentSession = {
    id: crypto.randomUUID(),
    agentId: agentId,
    title: `Session ${sessions.value.length + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0
  };
  
  try {
    await writeAgentSession(newSession);
    await loadSessions();
    currentSessionId.value = newSession.id;
  } catch (error) {
    console.error('Error creating new session:', error);
  }
};

const onSelectSession = (sessionId: string) => {
  currentSessionId.value = sessionId;
};

const onDeleteSession = async (sessionId: string) => {
  try {
    // Note: You might want to add a confirmation dialog here
    await deleteAgentSession(sessionId);
    await loadSessions();
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = undefined;
    }
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};
</script>

<template>
  <div class="relative size-full">
    <AgentConfig
      v-if="showConfig"
      :agent="agent"
      :create="!initialData"
      @update:agent="updateAgent"
      @launch="launchAgent"
    />
    <div v-else>
      <UButton
        class="absolute top-2 right-2"
        icon="i-heroicons-arrow-up-tray-20-solid"
        @click="showConfig = true"
      ></UButton>
      <div class="flex">
        <aside class="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium">Sessions</h3>
            <UButton
              icon="i-heroicons-plus"
              size="sm"
              @click="onNewSession"
            />
          </div>
          
          <div v-if="sessions.length === 0" class="text-gray-500 text-sm">
            No sessions yet. Create one to get started.
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="session in sessions"
              :key="session.id"
              class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800': currentSessionId === session.id }"
              @click="onSelectSession(session.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium truncate">{{ session.title }}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ session.updatedAt.toLocaleDateString() }} {{ session.updatedAt.toLocaleTimeString() }}
                  </p>
                  <p v-if="session.messageCount" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ session.messageCount }} messages
                  </p>
                </div>
                <UButton
                  icon="i-heroicons-trash"
                  size="xs"
                  color="red"
                  variant="ghost"
                  @click.stop="onDeleteSession(session.id)"
                />
              </div>
            </div>
          </div>
        </aside>
        <AgentChat v-if="currentSessionId" :key="currentSessionId" :agent="agent" :session-id="currentSessionId" />
        <div v-else class="flex-1 flex items-center justify-center text-gray-500">
          Select a session or create a new one to start chatting
        </div>
      </div>
    </div>
  </div>
</template>
