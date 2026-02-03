import { db } from '.';
import type { McpServer } from '@/types/mcp';

export interface ChatModelConfig {
  apiKey: string;
  models: string[];
}

export interface AgentConfig {
  useCustomModel?: boolean;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

interface ChatSettings {
  chatModel: string;
  mcpServers: string[];
}

interface WebSearchSettings {
  apiKey: string;
}

interface SettingRecord {
  id: string;
  type: string;
  key: string;
  value: string;
}

// ============== MODEL SETTINGS ==============

export async function writeModelSetting(
  key: string,
  config: ChatModelConfig
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const id = `model::${key}`;
  const value = JSON.stringify(config);

  await db.execute(
    `INSERT OR REPLACE INTO settings (id, type, key, value)
     VALUES ($1, $2, $3, $4)`,
    [id, 'model', key, value]
  );
}

export async function writeAllModelSettings(
  settings: Record<string, ChatModelConfig>
): Promise<void> {
  for (const [key, config] of Object.entries(settings)) {
    await writeModelSetting(key, config);
  }
}

export async function getModelSetting(
  key: string
): Promise<ChatModelConfig | null> {
  if (!db) throw new Error('Database not initialized');
  const id = `model::${key}`;
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE id = $1`,
    [id]
  );
  if (result.length === 0) return null;
  return JSON.parse(result[0].value) as ChatModelConfig;
}

export async function getAllModelSettings(): Promise<Record<string, ChatModelConfig>> {
  if (!db) throw new Error('Database not initialized');
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE type = 'model'`
  );

  const settings: Record<string, ChatModelConfig> = {};
  for (const row of result) {
    settings[row.key] = JSON.parse(row.value) as ChatModelConfig;
  }
  return settings;
}

// ============== AGENT SETTINGS ==============

export async function writeAgentSetting(
  key: string,
  config: AgentConfig
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const id = `agent::${key}`;
  const value = JSON.stringify(config);

  await db.execute(
    `INSERT OR REPLACE INTO settings (id, type, key, value)
     VALUES ($1, $2, $3, $4)`,
    [id, 'agent', key, value]
  );
}

export async function writeAllAgentSettings(
  settings: Record<string, AgentConfig>
): Promise<void> {
  for (const [key, config] of Object.entries(settings)) {
    await writeAgentSetting(key, config);
  }
}

export async function getAgentSetting(
  key: string
): Promise<AgentConfig | null> {
  if (!db) throw new Error('Database not initialized');
  const id = `agent::${key}`;
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE id = $1`,
    [id]
  );
  if (result.length === 0) return null;
  return JSON.parse(result[0].value) as AgentConfig;
}

export async function getAllAgentSettings(): Promise<Record<string, AgentConfig>> {
  if (!db) throw new Error('Database not initialized');
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE type = 'agent'`
  );

  const settings: Record<string, AgentConfig> = {};
  for (const row of result) {
    settings[row.key] = JSON.parse(row.value) as AgentConfig;
  }
  return settings;
}

// ============== CHAT SETTINGS ==============

export async function writeChatSettings(
  settings: ChatSettings
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const id = 'chat::default';
  const value = JSON.stringify(settings);

  await db.execute(
    `INSERT OR REPLACE INTO settings (id, type, key, value)
     VALUES ($1, $2, $3, $4)`,
    [id, 'chat', 'default', value]
  );
}

export async function getChatSettings(): Promise<ChatSettings | null> {
  if (!db) throw new Error('Database not initialized');
  const id = 'chat::default';
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE id = $1`,
    [id]
  );
  if (result.length === 0) return null;
  return JSON.parse(result[0].value) as ChatSettings;
}

// ============== WEB SEARCH SETTINGS ==============

export async function writeWebSearchSettings(
  settings: WebSearchSettings
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const id = 'websearch::default';
  const value = JSON.stringify(settings);

  await db.execute(
    `INSERT OR REPLACE INTO settings (id, type, key, value)
     VALUES ($1, $2, $3, $4)`,
    [id, 'websearch', 'default', value]
  );
}

export async function getWebSearchSettings(): Promise<WebSearchSettings | null> {
  if (!db) throw new Error('Database not initialized');
  const id = 'websearch::default';
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE id = $1`,
    [id]
  );
  if (result.length === 0) return null;
  return JSON.parse(result[0].value) as WebSearchSettings;
}

// ============== UTILITY FUNCTIONS ==============

export async function clearAllSettings(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.execute('DELETE FROM settings');
}

// ============== MCP SERVER SETTINGS ==============

export async function writeMcpServer(server: McpServer): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const id = `mcp::${server.id}`;
  const value = JSON.stringify(server);

  await db.execute(
    `INSERT OR REPLACE INTO settings (id, type, key, value)
     VALUES ($1, $2, $3, $4)`,
    [id, 'mcp', server.id, value]
  );
}

export async function getAllMcpServers(): Promise<Record<string, McpServer>> {
  if (!db) throw new Error('Database not initialized');
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE type = 'mcp'`
  );

  const servers: Record<string, McpServer> = {};
  for (const row of result) {
    servers[row.key] = JSON.parse(row.value) as McpServer;
  }
  return servers;
}

export async function getMcpServer(
  serverId: string
): Promise<McpServer | null> {
  if (!db) throw new Error('Database not initialized');
  const id = `mcp::${serverId}`;
  const result = await db.select<SettingRecord[]>(
    `SELECT * FROM settings WHERE id = $1`,
    [id]
  );
  if (result.length === 0) return null;
  return JSON.parse(result[0].value) as McpServer;
}

export async function deleteMcpServer(serverId: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const id = `mcp::${serverId}`;
  await db.execute('DELETE FROM settings WHERE id = $1', [id]);
}
