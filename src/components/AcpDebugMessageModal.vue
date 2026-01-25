<script setup lang="ts">
interface AcpDebugMessage {
  id: string;
  direction: 'sent' | 'received';
  program: string;
  message: any;
  timestamp: number;
}

defineProps<{
  message: AcpDebugMessage;
}>();

const emit = defineEmits<{ close: [] }>();

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false }) + '.' +
    String(date.getMilliseconds()).padStart(3, '0');
}
</script>

<template>
  <UModal :close="{ onClick: () => emit('close') }">
    <template #header>
      <div class="flex items-center gap-2 text-sm">
        <span :class="message.direction === 'sent' ? 'text-blue-500' : 'text-green-500'">
          {{ message.direction === 'sent' ? '▶ SENT' : '◀ RECEIVED' }}
        </span>
        <span class="font-mono">{{ message.program }}</span>
        <span>{{ formatTimestamp(message.timestamp) }}</span>
      </div>
    </template>
    <template #body>
      <pre class="whitespace-pre-wrap break-words text-xs max-h-[60vh] overflow-y-auto">{{ JSON.stringify(message.message, null, 2) }}</pre>
    </template>
  </UModal>
</template>
