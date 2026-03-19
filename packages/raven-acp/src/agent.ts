import * as acp from "@agentclientprotocol/sdk";
import { randomUUID } from "node:crypto";
import { AGENT_INFO, DEFAULT_MODE } from "./constants.ts";
import { getRuntimeConfig } from "./config.ts";
import { formatError, promptToText } from "./content.ts";
import { RavenRuntime } from "./runtime.ts";
import type { SessionState } from "./types.ts";

export class RavenACPAgent implements acp.Agent {
  private readonly config = getRuntimeConfig();
  private readonly runtime: RavenRuntime;
  private readonly sessions = new Map<string, SessionState>();

  public constructor(private readonly connection: acp.AgentSideConnection) {
    this.runtime = new RavenRuntime();
  }

  public async initialize(): Promise<acp.InitializeResponse> {
    return {
      protocolVersion: acp.PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: false,
      },
      agentInfo: AGENT_INFO,
    };
  }

  public async newSession(params: acp.NewSessionRequest): Promise<acp.NewSessionResponse> {
    const sessionId = randomUUID();

    this.sessions.set(sessionId, this.runtime.createSession(params.cwd));

    return {
      sessionId,
      modes: {
        availableModes: [DEFAULT_MODE],
        currentModeId: DEFAULT_MODE.id,
      },
      models: {
        availableModels: [
          {
            modelId: this.config.model,
            name: this.config.model,
            description: `OpenAI-compatible via ${this.config.baseUrl}`,
          },
        ],
        currentModelId: this.config.model,
      },
    };
  }

  public async authenticate(): Promise<acp.AuthenticateResponse> {
    return {};
  }

  public async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    const session = this.getSession(params.sessionId);
    const userText = promptToText(params.prompt);

    if (!userText) {
      return { stopReason: "end_turn" };
    }

    session.abortController?.abort();

    const abortController = new AbortController();
    session.abortController = abortController;

    try {
      const text = await this.runtime.prompt(session, userText, {
        signal: abortController.signal,
      });

      if (text) {
        await this.sendText(params.sessionId, text);
      }

      return { stopReason: "end_turn" };
    } catch (error) {
      if (abortController.signal.aborted) {
        return { stopReason: "cancelled" };
      }

      await this.sendText(params.sessionId, `raven error: ${formatError(error)}`);

      return { stopReason: "end_turn" };
    } finally {
      if (session.abortController === abortController) {
        session.abortController = null;
      }
    }
  }

  public async cancel(params: acp.CancelNotification): Promise<void> {
    this.sessions.get(params.sessionId)?.abortController?.abort();
  }

  public async setSessionMode(): Promise<acp.SetSessionModeResponse> {
    return {};
  }

  private getSession(sessionId: string): SessionState {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session;
  }

  private async sendText(sessionId: string, text: string): Promise<void> {
    await this.connection.sessionUpdate({
      sessionId,
      update: {
        sessionUpdate: "agent_message_chunk",
        content: {
          type: "text",
          text,
        },
      },
    });
  }
}
