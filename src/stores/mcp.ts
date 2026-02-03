import { ref } from 'vue';
import { defineStore } from 'pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { McpServerConfig } from '@/types/mcp';

export interface McpTool {
  name: string;
  description?: string;
  input_schema?: any;
  output_schema?: any;
  annotations?: any;
}

export interface McpLogEntry {
  timestamp: number;
  level: 'info' | 'error' | 'stdout' | 'stderr';
  message: string;
}

export interface McpConnection {
  serverId: string;
  tools: McpTool[];
  status: 'starting' | 'connected' | 'failed' | 'disconnected';
  error?: string;
}

export const useMcpStore = defineStore('mcp', () => {
  const connections = ref<Map<string, McpConnection>>(new Map());
  let eventListenerUnsubscribe: (() => void) | null = null;

  const setupEventListeners = async () => {
    if (eventListenerUnsubscribe) {
      return; // Already setup
    }

    const unlisten = await listen<{ 
      serverId: string; 
      status: string; 
      tools?: McpTool[]; 
      error?: string 
    }>('mcp-server-status', (event) => {
      const { serverId, status, tools, error } = event.payload;

      console.log(`[MCP Store] Server ${serverId} status: ${status}`, { tools, error });

      if (status === 'connected') {
        connections.value.set(serverId, {
          serverId,
          tools: tools ?? [],
          status: 'connected',
        });
      } else if (status === 'failed') {
        connections.value.set(serverId, {
          serverId,
          tools: [],
          status: 'failed',
          error,
        });
      } else if (status === 'starting') {
        connections.value.set(serverId, {
          serverId,
          tools: [],
          status: 'starting',
        });
      } else if (status === 'disconnected') {
        connections.value.delete(serverId);
      }
    });

    eventListenerUnsubscribe = unlisten;
  };

  const getConnection = (serverId: string): McpConnection | undefined => {
    return connections.value.get(serverId);
  };

  const getTools = (serverId: string): McpTool[] => {
    return connections.value.get(serverId)?.tools || [];
  };

  const getAllConnections = (): McpConnection[] => {
    return Array.from(connections.value.values());
  };

  const startServers = async (servers: Record<string, McpServerConfig>): Promise<Record<string, string[]>> => {
    const configs = Object.entries(servers).map(([id, config]) => [id, config]);
    await setupEventListeners();
    const result = await invoke<Record<string, string[]>>('mcp_start_servers', { configs });
    return result;
  };

  const stopServer = async (serverId: string): Promise<void> => {
    await invoke('mcp_stop_server', { serverId });
  };

  const stopAllServers = async (): Promise<void> => {
    try {
      const serverIds = await invoke<string[]>('mcp_list_servers');
      await Promise.all(serverIds.map((id) => stopServer(id)));
    } catch (error) {
      const errorMsg = error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : String(error);
      if (!errorMsg.includes('not initialized')) {
        throw error;
      }
    }
  };

  const callTool = async (serverId: string, toolName: string, args?: any): Promise<any> => {
    const result = await invoke('mcp_call_tool', {
      request: {
        serverId,
        toolName,
        arguments: args,
      },
    });
    return result;
  };

  const getServerLogs = async (serverId: string): Promise<McpLogEntry[]> => {
    const logs = await invoke<McpLogEntry[]>('mcp_get_server_logs', { serverId });
    return logs;
  };

  const getAllTools = async (): Promise<McpTool[]> => {
    const tools = await invoke<McpTool[]>('mcp_list_tools');
    return tools;
  };

  const cleanup = () => {
    if (eventListenerUnsubscribe) {
      eventListenerUnsubscribe();
      eventListenerUnsubscribe = null;
    }
    connections.value.clear();
  };

  return {
    connections,
    setupEventListeners,
    getConnection,
    getTools,
    getAllConnections,
    startServers,
    stopServer,
    stopAllServers,
    callTool,
    getServerLogs,
    getAllTools,
    cleanup,
  };
});
