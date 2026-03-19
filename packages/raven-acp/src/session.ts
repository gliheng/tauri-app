import { SystemMessage } from "@langchain/core/messages";
import { createSystemPrompt } from "./prompts.ts";
import type { SessionState } from "./types.ts";

export function createSession(cwd: string): SessionState {
  return {
    abortController: null,
    cwd,
    messages: [new SystemMessage(createSystemPrompt(cwd))],
  };
}
