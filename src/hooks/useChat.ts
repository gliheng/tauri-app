import {
  convertToCoreMessages,
  Message,
  streamText,
  appendResponseMessages,
} from "ai";
import { getModel } from "@/llm";
import { useChat as aiUseChat } from "@ai-sdk/vue";
import { updateChat, writeChat, writeMessages } from "@/db";
import { generateTopic } from "@/llm/prompt";
import { useTabsStore } from "@/stores/tabs";

export function useChat(opts: { id: string; initialMessages?: Message[] }) {
  return aiUseChat({
    id: opts.id,
    initialMessages: opts.initialMessages,
    sendExtraMessageFields: true,
    fetch: async (_url, req) => {
      const { messages, data } = JSON.parse(req!.body as unknown as string);
      const userMessage = messages[messages.length - 1];
      // Async update chat meta data
      (async () => {
        if (messages.length === 1) {
          const { text: topic } = await generateTopic(messages[0].content);
          await writeChat({
            id: opts.id,
            topic,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          useTabsStore().setTitle(opts.id, topic);
        } else {
          await updateChat(opts.id, {
            updatedAt: new Date(),
          });
        }
      })();
      // await writeMessages(opts.id, [userMessage]);
      const ret = streamText({
        model: getModel(data?.model),
        messages: convertToCoreMessages(messages),
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
