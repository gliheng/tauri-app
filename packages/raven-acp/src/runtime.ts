import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { getRuntimeConfig } from "./config.ts";
import { messageToText } from "./content.ts";
import { createGraph } from "./graph.ts";
import { createSession } from "./session.ts";
import type { ConversationGraph, SessionState } from "./types.ts";

export class RavenRuntime {
  private readonly config = getRuntimeConfig();
  private readonly graphPromise: Promise<ConversationGraph>;

  public constructor() {
    this.graphPromise = createGraph(this.config);
  }

  public createSession(cwd: string): SessionState {
    return createSession(cwd);
  }

  public async prompt(
    session: SessionState,
    userText: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<string> {
    const text = userText.trim();

    if (!text) {
      return "";
    }

    session.messages = [...session.messages, new HumanMessage(text)];

    const graph = await this.graphPromise;
    const result = await graph.invoke(
      {
        cwd: session.cwd,
        messages: session.messages,
      },
      options,
    );

    const aiMessage =
      [...result.messages].reverse().find((message): message is AIMessage => message instanceof AIMessage) ??
      result.messages[result.messages.length - 1];

    session.messages = [...result.messages];

    return messageToText(aiMessage);
  }
}
