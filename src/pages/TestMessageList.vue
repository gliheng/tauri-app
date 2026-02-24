<script setup lang="ts">
import { onActivated, ref } from 'vue';
import MessageList from '@/components/AgentChat/MessageList.vue';
import { useTabsStore } from '@/stores/tabs';

// Type definitions matching useAcp.ts
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  parts: any[];
}

// Test messages with different types
const testMessages = ref<Message[]>([
  {
    id: '1',
    content: 'Hello! Can you help me with something?',
    role: 'user',
    parts: [{
      type: 'text',
      text: 'Hello! Can you help me with something?',
    }],
  },
  {
    id: '2',
    content: 'Of course! Let me think about the best approach...',
    role: 'assistant',
    parts: [{
      type: 'thought',
      thought: 'The user is asking for help. I should understand what they need first before proceeding with any actions.',
    }],
  },
  {
    id: '3',
    content: 'I will help you by following these steps:',
    role: 'assistant',
    parts: [{
      type: 'plan',
      plan: [
        { content: "Analyze the user's request", status: 'completed', priority: 'high' },
        { content: 'Identify the problem', status: 'in_progress', priority: 'high' },
        { content: 'Provide a solution', status: 'pending', priority: 'medium' },
        { content: 'Verify the results', status: 'pending', priority: 'low' },
      ],
    }],
  },
  {
    id: '4',
    content: 'Read the configuration file',
    role: 'assistant',
    parts: [{
      type: 'tool_call',
      toolCallId: 'read-file-001',
      title: 'Read configuration file',
      commandName: 'read_file',
      arguments: { path: '/path/to/config.yaml' },
      status: 'completed',
      output: 'Configuration loaded successfully',
    }],
  },
  {
    id: '5',
    content: "Based on the configuration, here's what I found: The settings look good. The API endpoint is configured to use https://api.example.com/v1.",
    role: 'assistant',
    parts: [{
      type: 'text',
      text: "Based on the configuration, here's what I found: The settings look good. The API endpoint is configured to use https://api.example.com/v1.",
    }],
  },
  {
    id: '6',
    content: 'Thank you for the help!',
    role: 'user',
    parts: [{
      type: 'text',
      text: 'Thank you for the help!',
    }],
  },
  {
    id: '7',
    content: 'Download log files from server',
    role: 'assistant',
    parts: [{
      type: 'tool_call',
      toolCallId: 'download-logs-001',
      title: 'Download log files from server',
      commandName: 'terminal_create',
      arguments: { command: 'wget', args: ['https://logs.example.com/latest.zip'] },
      status: 'pending',
    }],
  },
  {
    id: '8',
    content: 'Check out this screenshot of the issue:',
    role: 'assistant',
    parts: [{
      type: 'resource_link',
      uri: 'https://example.com/screenshot.png',
      name: 'screenshot.png',
      mimeType: 'image/png',
      title: 'Issue Screenshot',
      description: 'Shows the error in the UI',
      size: 102400,
    }],
  },
]);

const tabsStore = useTabsStore();
onActivated(() => {
  tabsStore.openTab('/msglist', "Test message list");
});
</script>

<template>
  <div class="h-full overflow-y-auto flex">
    <MessageList :messages="testMessages" />
  </div>
</template>

<style lang="scss" scoped>
</style>
