<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useMcpStore, type McpLogEntry } from '@/stores/mcp';

const props = defineProps<{
  serverName: string;
  serverId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const logs = ref<McpLogEntry[]>([]);
const loading = ref(true);

const mcpStore = useMcpStore();

const loadLogs = async () => {
  loading.value = true;
  try {
    logs.value = await mcpStore.getServerLogs(props.serverId);
  } catch (error) {
    console.error('Failed to load logs:', error);
  } finally {
    loading.value = false;
  }
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${time}.${ms}`;
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'error':
    case 'stderr':
      return 'text-error';
    case 'info':
      return 'text-info';
    case 'stdout':
      return 'text-success';
    default:
      return 'text-muted';
  }
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'error':
    case 'stderr':
      return 'i-lucide-circle-x';
    case 'info':
      return 'i-lucide-info';
    case 'stdout':
      return 'i-lucide-terminal';
    default:
      return 'i-lucide-circle';
  }
};

const hasErrorLogs = computed(() => {
  return logs.value.some(log => log.level === 'error' || log.level === 'stderr');
});

onMounted(async () => {
  await loadLogs();
});
</script>

<template>
  <UModal :close="{ onClick: () => emit('close') }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="i-lucide-scroll-text text-xl" />
        <div>
          <div class="font-semibold">Server Logs</div>
          <div class="text-sm text-muted">{{ serverName }}</div>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="loading" class="text-center py-8">
        <div class="i-lucide-loader-2 text-4xl animate-spin mb-2" />
        <p class="text-muted">Loading logs...</p>
      </div>

      <div v-else-if="logs.length === 0" class="text-center py-8 text-muted">
        <div class="i-lucide-file-text text-4xl mb-2" />
        <p>No logs available</p>
        <p class="text-sm mt-1">Logs will appear here when the server produces output</p>
      </div>

      <div v-else class="space-y-2">
        <div class="flex items-center gap-2 mb-2">
          <UButton
            icon="i-lucide-refresh-cw"
            label="Refresh"
            size="xs"
            variant="outline"
            @click="loadLogs"
          />
        </div>

        <div
          ref="logContainer"
          class="max-h-96 overflow-y-auto font-mono text-xs space-y-1"
        >
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="flex items-start gap-2 px-1 py-0.5 rounded border border-accented"
          >
            <div class="text-muted whitespace-nowrap">
              {{ formatTimestamp(log.timestamp) }}
            </div>
            <div
              :class="[getLevelIcon(log.level), getLevelColor(log.level)]"
              class="mt-0.5"
            />
            <div class="flex-1 break-all">
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Close" @click="emit('close')" />
      </div>
    </template>
  </UModal>
</template>
