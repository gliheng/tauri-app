export type McpServerType = 'stdio' | 'http' | 'sse';

export interface McpEnvVariable {
  name: string;
  value: string;
}

export interface McpHttpHeader {
  name: string;
  value: string;
}

// Discriminated union for type-safe server configs
export interface McpServerStdioConfig {
  type: 'stdio';
  name: string;
  description?: string;
  command: string;
  args: string[];
  env: McpEnvVariable[];
}

export interface McpServerHttpConfig {
  type: 'http';
  name: string;
  description?: string;
  url: string;
  headers: McpHttpHeader[];
}

export interface McpServerSseConfig {
  type: 'sse';
  name: string;
  description?: string;
  url: string;
  headers?: McpHttpHeader[];
}

export type McpServerConfig =
  | McpServerStdioConfig
  | McpServerHttpConfig
  | McpServerSseConfig;

// Stored format (with metadata)
export interface McpServer {
  id: string;
  config: McpServerConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
