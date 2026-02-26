<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useMcpStore } from "@/stores/mcp";
import McpServerModal from "./McpServerModal.vue";
import McpImportModal from "./McpImportModal.vue";
import McpDetailsModal from "./McpDetailsModal.vue";
import McpLogsModal from "./McpLogsModal.vue";
import type { McpServer } from "@/types/mcp";
import { generateId } from "@/utils/id";

const overlay = useOverlay();
const mcpServerModal = overlay.create(McpServerModal);
const mcpImportModal = overlay.create(McpImportModal);
const mcpDetailsModal = overlay.create(McpDetailsModal);
const mcpLogsModal = overlay.create(McpLogsModal);

const mcpStore = useMcpStore();
const { mcpServers } = storeToRefs(useSettingsStore());

onMounted(async () => {
  await mcpStore.setupEventListeners();
});

const addMcpServer = async () => {
  const server = await mcpServerModal.open() as McpServer | null;
  if (!server) return;

  mcpServers.value[server.id] = {
    ...server,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const editMcpServer = async (serverId: string) => {
  const existing = mcpServers.value[serverId];
  if (!existing) return;

  const server = await mcpServerModal.open({ server: existing }) as McpServer | null;
  if (!server) return;

  mcpServers.value[serverId] = {
    ...server,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
};

const deleteMcpServer = async (serverId: string) => {
  const server = mcpServers.value[serverId];
  if (!server) return;
  
  const ok = await confirm(
    `Are you sure you want to delete "${server.config.name}"?\n\nThis action cannot be undone.`
  );
  
  if (ok) {
    delete mcpServers.value[serverId];
  }
};

const getServerIcon = (server: McpServer) => {
  switch (server.config.type) {
    case 'stdio': return 'i-lucide-terminal';
    case 'http': return 'i-lucide-globe';
    case 'sse': return 'i-lucide-radio';
  }
};

const getServerTypeLabel = (type: string) => {
  return type.toUpperCase();
};

const getServerStatus = (serverId: string) => {
  return mcpStore.getConnection(serverId);
};

const getStatusBadgeProps = (status: any) => {
  if (!status) return null;
  
  switch (status.status) {
    case 'starting':
      return { color: 'warning', label: 'Starting...' };
    case 'connected':
      return { color: 'success', label: `Connected (${status.tools.length} tools)` };
    case 'failed':
      return { color: 'error', label: 'Failed' };
    case 'disconnected':
      return { color: 'neutral', label: 'Disconnected' };
    default:
      return null;
  }
};

const viewDetails = async (serverId: string, serverName: string) => {
  const tools = mcpStore.getTools(serverId);
  const resources = mcpStore.getResources(serverId);
  const prompts = mcpStore.getPrompts(serverId);
  await mcpDetailsModal.open({
    serverName,
    tools,
    resources,
    prompts
  });
};

const viewLogs = async (serverId: string, serverName: string) => {
  await mcpLogsModal.open({ serverId, serverName });
};

const importMcpServers = async () => {
  const jsonContent = await mcpImportModal.open() as string | null;
  if (!jsonContent) return;

  try {
    const json = JSON.parse(jsonContent);

    const serversToImport: Array<{ name: string; config: McpServer['config'] }> = [];

    if (json.mcpServers) {
      for (const [name, serverConfig] of Object.entries(json.mcpServers)) {
        const config = serverConfig as any;

        if (config.command) {
          serversToImport.push({
            name,
            config: {
              type: 'stdio',
              name,
              command: config.command,
              args: config.args || [],
              env: Object.entries(config.env || {}).map(([name, value]) => ({
                name,
                value: String(value)
              }))
            }
          });
        }
        else if (config.url && (!config.transport || config.transport === 'http')) {
          serversToImport.push({
            name,
            config: {
              type: 'http',
              name,
              url: config.url,
              headers: Object.entries(config.headers || {}).map(([name, value]) => ({
                name,
                value: String(value)
              }))
            }
          });
        }
        else if (config.url && config.transport === 'sse') {
          serversToImport.push({
            name,
            config: {
              type: 'sse',
              name,
              url: config.url,
              headers: Object.entries(config.headers || {}).map(([name, value]) => ({
                name,
                value: String(value)
              }))
            }
          });
        }
      }
    }

    let imported = 0;
    for (const { config } of serversToImport) {
      const id = generateId();

      mcpServers.value[id] = {
        id,
        config,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      imported++;
    }

    if (imported > 0) {
      alert(`Successfully imported ${imported} MCP server(s)`);
    } else if (serversToImport.length > 0) {
      alert('No servers imported (all servers already exist)');
    } else {
      alert('No valid MCP servers found in JSON');
    }
  } catch (error) {
    console.error('Failed to import MCP servers:', error);
    alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-2 justify-center">
      <UFieldGroup>
        <UButton
          icon="i-lucide-plus"
          label="Add Server"
          color="primary"
          @click="addMcpServer"
        />
        <UButton
          icon="i-lucide-upload"
          label="Import JSON"
          variant="outline"
          @click="importMcpServers"
        />
      </UFieldGroup>
    </div>

    <div v-if="Object.keys(mcpServers).length > 0" class="space-y-2">
      <div
        v-for="(server, serverId) in mcpServers"
        :key="serverId"
        class="flex items-center gap-3 p-3 rounded-lg border border-accented"
        :class="{ 'opacity-50': !server.enabled }"
      >
        <div class="flex-shrink-0">
          <div :class="getServerIcon(server)" class="text-xl" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-medium truncate">{{ server.config.name }}</div>
            <span v-if="!server.enabled" class="text-xs text-warning">(disabled)</span>
            <UBadge
              v-if="getStatusBadgeProps(getServerStatus(serverId))"
              :color="getStatusBadgeProps(getServerStatus(serverId))!.color"
              :label="getStatusBadgeProps(getServerStatus(serverId))!.label"
              size="xs"
            />
          </div>
          <div v-if="server.config.description" class="text-sm text-muted truncate">
            {{ server.config.description }}
          </div>
          <div class="text-sm text-muted flex items-center gap-2">
            <span>{{ getServerTypeLabel(server.config.type) }}</span>
          </div>
          <div v-if="server.config.type === 'stdio'" class="text-xs text-muted">
            {{ server.config.command }}
          </div>
          <div v-else class="text-xs text-muted truncate">
            {{ server.config.url }}
          </div>
        </div>

        <div class="flex gap-1">
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="editMcpServer(serverId)"
          />
          <UButton
            v-if="getServerStatus(serverId)?.status === 'connected'"
            icon="i-lucide-cpu"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="viewDetails(serverId, server.config.name)"
          />
          <UButton
            icon="i-lucide-scroll-text"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="viewLogs(serverId, server.config.name)"
          />
          <UButton
            icon="i-lucide-trash"
            variant="ghost"
            color="error"
            size="sm"
            @click="deleteMcpServer(serverId)"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-muted">
      <div class="text-4xl mb-2 i-mdi-server" />
      <p class="text-lg font-medium mb-1">No MCP Servers</p>
      <p class="text-sm">Add a server to extend agent capabilities</p>
    </div>
  </div>
</template>
