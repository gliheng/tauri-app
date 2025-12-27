<script setup lang="ts">
import { ref } from "vue";
import { getAgentSessions, type AgentSession, deleteAgentSession } from "@/db";

const props = defineProps({
  agentId: {
    type: String,
    required: true,
  },
});

const chatId = defineModel<string>('chat-id');

const { agentId } = props;
const sessions = ref<AgentSession[]>(await getAgentSessions(agentId));

const loadSessions = async () => {
  try {
    sessions.value = await getAgentSessions(props.agentId);
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
};

const onDeleteSession = async (id: string) => {
  try {
    // Note: You might want to add a confirmation dialog here
    await deleteAgentSession(id);
    await loadSessions();
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

const emit = defineEmits(['new-session']);

</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium">Sessions</h3>
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        @click="emit('new-session')"
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
        :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800': chatId === session.id }"
        @click="chatId = session.id"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <h4 class="font-medium truncate">{{ session.title }}</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ session.updatedAt.toLocaleDateString() }} {{ session.updatedAt.toLocaleTimeString() }}
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
  </div>
</template>

<style lang="scss" scoped>
</style>