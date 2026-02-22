import { UIMessage } from "ai";

export function messageToText(message: UIMessage) {
  return (message.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => (part as any).text)
    .join("\n");
}
