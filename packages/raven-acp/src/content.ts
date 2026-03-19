import * as acp from "@agentclientprotocol/sdk";
import type { BaseMessage } from "@langchain/core/messages";

export function blockToText(block: acp.ContentBlock): string {
  if (block.type === "text") {
    return block.text ?? "";
  }

  if (block.type === "resource_link") {
    return `[resource:${block.name}] ${block.uri}`;
  }

  if (block.type === "resource") {
    const uri = "uri" in block.resource ? block.resource.uri : undefined;
    return `[resource] ${uri ?? "embedded"}`;
  }

  if (block.type === "image") {
    return "[image omitted]";
  }

  if (block.type === "audio") {
    return "[audio omitted]";
  }

  return "";
}

export function promptToText(prompt: acp.PromptRequest["prompt"]): string {
  return prompt
    .map(blockToText)
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function messageToText(message: BaseMessage | undefined): string {
  if (!message) {
    return "";
  }

  const content = message.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if ("text" in part && typeof part.text === "string") {
          return part.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
