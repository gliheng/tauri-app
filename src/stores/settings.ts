import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { defaultsDeep, debounce } from 'lodash-es';
import * as settingsDb from "@/db/settings";
import type { McpServer } from "@/types/mcp";
import { useMcpStore } from "@/stores/mcp";

export interface ChatModelConfig {
  apiKey: string;
  models: string[];
}

const defaultModelSettings: Record<string, ChatModelConfig> = {
  deepseek: {
    apiKey: "",
    models: [],
  },
  minimax: {
    apiKey: "",
    models: [],
  },
  zai: {
    apiKey: "",
    models: [],
  },
  openrouter: {
    apiKey: "",
    models: [],
  },
  siliconflow: {
    apiKey: "",
    models: [],
  },
};

export interface AgentConfig {
  useCustomModel?: boolean;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

const defaultAgentSettings: Record<string, AgentConfig> = {
  codex: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  gemini: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  claude: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  qwen: {
    useCustomModel: false,
    baseUrl: "",
    model: "",
    apiKey: "",
  },
  opencode: {
    useCustomModel: false,
    model: "",
  },
};

const defaultChatSettings = {
  chatModel: 'deepseek::deepseek-chat',
  mcpServers: [] as string[],
};

const defaultWebSearchSettings = {
  apiKey: '',
};

const defaultMcpSettings: Record<string, McpServer> = {};

export async function loadAgentSettings() {
  const dbSettings = await settingsDb.getAllAgentSettings();
  return defaultsDeep({}, dbSettings, defaultAgentSettings) as Record<string, AgentConfig>;
}

export async function loadModelSettings() {
  const dbSettings = await settingsDb.getAllModelSettings();
  return defaultsDeep({}, dbSettings, defaultModelSettings) as Record<string, ChatModelConfig>;
}

export async function loadChatSettings() {
  const dbSettings = await settingsDb.getChatSettings();
  return defaultsDeep({}, dbSettings, defaultChatSettings) as typeof defaultChatSettings;
}

export async function loadWebSearchSettings() {
  const dbSettings = await settingsDb.getWebSearchSettings();
  return defaultsDeep({}, dbSettings, defaultWebSearchSettings) as typeof defaultWebSearchSettings;
}

export async function loadMcpSettings() {
  const dbSettings = await settingsDb.getAllMcpServers();
  return defaultsDeep({}, dbSettings, defaultMcpSettings) as Record<string, McpServer>;
}

export const useSettingsStore = defineStore("settings", () => {
  const modelSettings = ref<Record<string, ChatModelConfig>>({});
  const agentSettings = ref<Record<string, AgentConfig>>({});
  const chatSettings = ref<typeof defaultChatSettings>({} as typeof defaultChatSettings);
  const webSearchSettings = ref<typeof defaultWebSearchSettings>({} as typeof defaultWebSearchSettings);
  const mcpServers = ref<Record<string, McpServer>>({});
  const isRestartingMcp = ref(false);

  // Start MCP servers from settings
  async function initializeMcpServers() {
    const enabledServers = Object.entries(mcpServers.value)
      .filter(([, server]) => server.enabled)
      .map(([id, server]) => [id, server.config] as const);

    if (enabledServers.length > 0) {
      try {
        const mcpStore = useMcpStore();
        await mcpStore.startServers(Object.fromEntries(enabledServers));
        console.log(`[MCP] Started ${enabledServers.length} servers`);
      } catch (error) {
        console.error("[MCP] Failed to start servers:", error);
      }
    }
  }

  async function initializeStore() {
    modelSettings.value = await loadModelSettings();
    agentSettings.value = await loadAgentSettings();
    chatSettings.value = await loadChatSettings();
    webSearchSettings.value = await loadWebSearchSettings();
    mcpServers.value = await loadMcpSettings();

    // Start MCP servers after settings are loaded
    await initializeMcpServers();
  }

  initializeStore();

  watch(modelSettings, async (v) => {
    await settingsDb.writeAllModelSettings(v);
  }, {
    deep: true,
  });

  watch(agentSettings, async (v) => {
    await settingsDb.writeAllAgentSettings(v);
  }, {
    deep: true,
  });

  watch(chatSettings, async (v) => {
    await settingsDb.writeChatSettings(v);
  }, {
    deep: true,
  });

  watch(webSearchSettings, async (v) => {
    await settingsDb.writeWebSearchSettings(v);
  }, {
    deep: true,
  });

  // Debounced MCP server restart function
  const restartMcpServers = debounce(async () => {
    // Skip if already restarting
    if (isRestartingMcp.value) {
      return;
    }

    isRestartingMcp.value = true;
    try {
      const mcpStore = useMcpStore();
      await mcpStore.stopAllServers();
      await initializeMcpServers();
    } catch (error) {
      console.error("[MCP] Failed to restart servers:", error);
    } finally {
      isRestartingMcp.value = false;
    }
  }, 500);

  watch(mcpServers, async (v) => {
    // Persist to database
    for (const [id, server] of Object.entries(v)) {
      await settingsDb.writeMcpServer(server);
    }

    // Restart MCP servers with debouncing
    restartMcpServers();
  }, {
    deep: true,
  });

  return {
    modelSettings,
    agentSettings,
    chatSettings,
    webSearchSettings,
    mcpServers,
  };
});
