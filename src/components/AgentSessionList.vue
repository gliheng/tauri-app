<script setup lang="ts">
import { ref } from "vue";
import { getChatsByAgentId, deleteChat, type Chat } from "@/db";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useRouter } from "vue-router";
import { useTabsStore } from "@/stores/tabs";

const props = defineProps({
  agentId: {
    type: String,
    required: true,
  },
  chatId: {
    type: String,
    required: false,
  },
});

const { agentId } = props;
const sessions = ref<Chat[]>(await getChatsByAgentId(agentId));

const loadSessions = async () => {
  try {
    sessions.value = await getChatsByAgentId(props.agentId);
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
};

const router = useRouter();
function onOpenSession(session: Chat) {
  useTabsStore().openTab(`/chat/${session.id}`, session.topic);
  router.push({ name: 'chat', params: { id: session.id} });
}

const onDeleteSession = async (id: string) => {
  try {
    const ok = await confirm("This action cannot be reverted. Are you sure?", {
      title: "Delete chat",
      kind: "warning",
    });

    if (ok) {
      await deleteChat(id);
      await loadSessions();
    }
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

const emit = defineEmits(['new-session']);

</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium">Sessions</h3>
    </div>
    
    <div v-if="sessions.length === 0" class="text-center text-gray-500 text-sm py-12">
      No sessions yet. Create one to get started.
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <UCard
        v-for="session in sessions"
        :key="session.id"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        :ui="{
          body: { padding: 'p-4' },
          ring: chatId === session.id ? 'ring-2 ring-primary' : ''
        }"
        @click="() => onOpenSession(session)"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-medium text-base line-clamp-2 flex-1">{{ session.topic }}</h4>
            <UButton
              icon="i-heroicons-trash"
              size="xs"
              color="red"
              variant="ghost"
              @click.stop="onDeleteSession(session.id)"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ session.updatedAt.toLocaleDateString() }} {{ session.updatedAt.toLocaleTimeString() }}
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>