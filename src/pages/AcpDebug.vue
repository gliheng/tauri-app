<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { eventBus } from '@/utils/eventBus';
import { downloadFile } from '@/utils/file';
import AcpDebugMessageModal from '@/components/AcpDebugMessageModal.vue';

interface AcpDebugMessage {
  id: string;
  direction: 'sent' | 'received';
  program: string;
  message: any;
  timestamp: number;
}

const messages = ref<AcpDebugMessage[]>([]);
const autoScroll = ref(true);
const filterProgram = ref('__all__');
const filterDirection = ref<'all' | 'sent' | 'received'>('all');
const searchQuery = ref('');
const messageListRef = ref<HTMLElement | null>(null);

// Create modal overlay
const overlay = useOverlay();
const messageModal = overlay.create(AcpDebugMessageModal);

// Event handlers
const handleSentMessage = ({ program, message, timestamp }: { program: string; message: any; timestamp: number }) => {
  messages.value.push({
    id: `${timestamp}-${Math.random()}`,
    direction: 'sent',
    program,
    message,
    timestamp
  });
};

const handleReceivedMessage = ({ program, message, timestamp }: { program: string; message: string; timestamp: number }) => {
  let parsedMessage: any;
  try {
    parsedMessage = JSON.parse(message);
  } catch {
    parsedMessage = message;
  }

  messages.value.push({
    id: `${timestamp}-${Math.random()}`,
    direction: 'received',
    program,
    message: parsedMessage,
    timestamp
  });
};

onMounted(() => {
  // Subscribe to sent messages
  eventBus.on('acp_message_sent', handleSentMessage);

  // Subscribe to received messages
  eventBus.on('acp_message_received', handleReceivedMessage);
});

onUnmounted(() => {
  eventBus.off('acp_message_sent', handleSentMessage);
  eventBus.off('acp_message_received', handleReceivedMessage);
});

// Auto-scroll when new messages arrive
watch(messages, async () => {
  if (autoScroll.value && messageListRef.value) {
    await nextTick();
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
}, { deep: true });

// Computed stats
const stats = computed(() => ({
  total: messages.value.length,
  sent: messages.value.filter(m => m.direction === 'sent').length,
  received: messages.value.filter(m => m.direction === 'received').length,
}));

// Unique programs for filter
const programs = computed(() => {
  const progSet = new Set(messages.value.map(m => m.program));
  return Array.from(progSet);
});

// Filtered messages
const filteredMessages = computed(() => {
  return messages.value.filter(m => {
    if (filterProgram.value !== '__all__' && m.program !== filterProgram.value) return false;
    if (filterDirection.value !== 'all' && m.direction !== filterDirection.value) return false;
    if (searchQuery.value) {
      const json = JSON.stringify(m.message).toLowerCase();
      if (!json.includes(searchQuery.value.toLowerCase())) return false;
    }
    return true;
  });
});

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false }) + '.' +
    String(date.getMilliseconds()).padStart(3, '0');
}

function openMessage(msg: AcpDebugMessage) {
  messageModal.open({
    message: msg
  });
}

function clearMessages() {
  messages.value = [];
}

function exportToFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = new File(
    [JSON.stringify(messages.value, null, 2)],
    `acp-debug-${timestamp}.json`,
    { type: 'application/json' }
  );
  downloadFile(file);
}
</script>

<template>
  <div class="size-full p-4 flex flex-col gap-4 overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">ACP Debug</h1>
      <div class="flex gap-2">
        <UBadge>{{ stats.total }} total</UBadge>
        <UBadge color="success">{{ stats.sent }} sent</UBadge>
        <UBadge color="primary">{{ stats.received }} received</UBadge>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-2">
      <USelectMenu
        v-model="filterProgram"
        :items="[
          { label: 'All programs', value: '__all__' },
          ...programs.map(p => ({ label: p, value: p }))
        ]"
        value-key="value"
        placeholder="Filter by program"
        class="w-48"
      />
      <USelectMenu
        v-model="filterDirection"
        :items="[
          { label: 'All directions', value: 'all' },
          { label: 'Sent only', value: 'sent' },
          { label: 'Received only', value: 'received' }
        ]"
        value-key="value"
        class="w-36"
      />
      <UInput
        v-model="searchQuery"
        placeholder="Search messages..."
        icon="i-heroicons-magnifying-glass"
        class="w-64"
      />
      <UButton icon="i-heroicons-arrow-down-tray" @click="exportToFile">Export</UButton>
      <UButton icon="i-heroicons-trash" color="error" @click="clearMessages">Clear</UButton>
      <USwitch v-model="autoScroll" label="Auto-scroll" />
    </div>

    <!-- Message List -->
    <div ref="messageListRef" class="flex-1 overflow-y-auto space-y-2 font-mono text-sm">
      <div v-if="filteredMessages.length === 0" class="text-center text-gray-500 py-8">
        No messages captured yet
      </div>
      <UCard
        v-for="msg in filteredMessages"
        :key="msg.id"
        :ui="{ body: 'p-3' }"
        :class="[
          msg.direction === 'sent' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500',
          'cursor-pointer hover:bg-white/5 transition-colors'
        ]"
        @click="openMessage(msg)"
      >
        <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span :class="msg.direction === 'sent' ? 'text-blue-500' : 'text-green-500'">
            {{ msg.direction === 'sent' ? '▶ SENT' : '◀ RECEIVED' }}
          </span>
          <span class="font-mono">{{ msg.program }}</span>
          <span>{{ formatTimestamp(msg.timestamp) }}</span>
        </div>
        <pre class="whitespace-nowrap overflow-hidden text-ellipsis text-xs w-full">{{ JSON.stringify(msg.message, null, 2) }}</pre>
      </UCard>
    </div>
  </div>
</template>
