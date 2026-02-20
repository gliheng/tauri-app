<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { McpServer } from '@/types/mcp'

const modelValue = defineModel<string[]>({ default: () => [] })

type ServerItem = { label: string; value: string; icon: string }

const selectedItems = computed({
  get: () => {
    return enabledServers.value.filter((server: ServerItem) => modelValue.value.includes(server.value))
  },
  set: (items: ServerItem[]) => {
    modelValue.value = items.map((item: ServerItem) => item.value)
  }
})

const settingsStore = useSettingsStore()

const enabledServers = computed(() => {
  return Object.values(settingsStore.mcpServers)
    .filter((server: McpServer) => server.enabled)
    .map((server: McpServer) => ({
      label: server.config.name || server.id,
      value: server.id,
      icon: getServerIcon(server.config.type),
    }))
})

const getServerIcon = (type: string) => {
  switch (type) {
    case 'stdio':
      return 'i-lucide-terminal'
    case 'http':
      return 'i-lucide-globe'
    case 'sse':
      return 'i-lucide-radio'
    default:
      return 'i-lucide-plugs'
  }
}
</script>

<template>
  <UTooltip text="Select MCP servers">
    <USelectMenu
      v-model="selectedItems"
      multiple
      size="sm"
      variant="soft"
      trailing-icon="i-lucide-chevrons-up-down"
      :items="enabledServers"
      :class="[$style.selectMenu, enabledServers.length === 0 && $style.disabled]"
      :ui="{
        base: 'bg-primary/10 hover:bg-primary/15 text-primary-500 focus-visible:bg-primary/15',
        trailingIcon: 'text-primary-500',
      }"
      :disabled="enabledServers.length === 0"
    />
  </UTooltip>
</template>

<style module>
.selectMenu {
  width: 7rem;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
