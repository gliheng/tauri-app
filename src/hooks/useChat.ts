import {
  convertToCoreMessages,
  Message,
  streamText,
  appendResponseMessages,
} from "ai";
import { getModel } from "@/llm";
import { useChat as aiUseChat } from "@ai-sdk/vue";
import { writeChat, writeMessages } from "@/db";

export function useChat(opts: { id: string; initialMessages?: Message[] }) {
  return aiUseChat({
    id: opts.id,
    initialMessages: opts.initialMessages,
    sendExtraMessageFields: true,
    fetch: async (_url, req) => {
      const { messages, data } = JSON.parse(req!.body as unknown as string);
      if (messages.length === 1) {
        // TODO: Gnerate topic
        await writeChat({
          id: opts.id,
          topic: "just some chat",
        });
      }
      const userMessage = messages[messages.length - 1];
      // await writeMessages(opts.id, [userMessage]);
      const ret = streamText({
        model: getModel(data?.model),
        messages: convertToCoreMessages(messages),
        onChunk: (chunk) => {
          console.info(chunk);
        },
        onFinish: async ({ response }) => {
          const messages = appendResponseMessages({
            messages: [userMessage],
            responseMessages: response.messages,
          });
          await writeMessages(opts.id, messages);
        },
      });
      return ret.toDataStreamResponse({
        sendReasoning: true,
        sendUsage: true,
      });
    },
  });
}
