import type { BaseMessage } from "@langchain/core/messages";

export interface RuntimeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  modelProvider: string;
}

export type TransportMode = "acp" | "terminal";

export interface CliOptions {
  transport: TransportMode;
}

export interface SessionState {
  abortController: AbortController | null;
  cwd: string;
  messages: BaseMessage[];
}

export interface ConversationGraph {
  invoke(
    input: { cwd: string; messages: BaseMessage[] },
    options?: { signal?: AbortSignal },
  ): Promise<{ messages: BaseMessage[] }>;
}
