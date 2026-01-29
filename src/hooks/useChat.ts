import {
  Message,
  streamText,
  convertToCoreMessages,
  appendResponseMessages,
} from "ai";
import { getModel } from "@/llm";
import { useChat as aiUseChat, UseChatOptions } from "@ai-sdk/vue";
import { updateChat, writeChat, writeMessages } from "@/db";
import { generateTopic } from "@/llm/prompt";
import { useTabsStore } from "@/stores/tabs";
import { tavilySearchTool, tavilyExtractTool } from "@/llm/tools/tavily";

export function useChat(opts: {
  id: string;
  initialMessages?: Message[];
  onFinish?: UseChatOptions["onFinish"];
}) {
  return aiUseChat({
    id: opts.id,
    initialMessages: opts.initialMessages,
    sendExtraMessageFields: true,
    onFinish: opts.onFinish,
    fetch: async (_url, req) => {
      const { messages, data } = JSON.parse(req!.body as unknown as string);
      const userMessage = messages[messages.length - 1];
      const prevAssistantMessage = messages[messages.length - 2];
      const webSearch = data?.webSearch === true;
      
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
          useTabsStore().setTitle(`/chat/${opts.id}`, topic);
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
        maxSteps: 30,
        tools: webSearch ? {
          web_search: tavilySearchTool,
          web_extract: tavilyExtractTool,
        } : undefined,
        async onFinish({ response }) {
          const messages = appendResponseMessages({
            messages: [userMessage],
            responseMessages: response.messages,
          });
          await writeMessages(opts.id, messages, prevAssistantMessage?.id);
        },
        onError(error) {
          console.error('useChat onError', error);
        },
        abortSignal: req?.signal ?? undefined,
      });
      return ret.toDataStreamResponse({
        sendReasoning: true,
        sendUsage: true,
        getErrorMessage: (error: unknown) => {
          if (error == null) return 'unknown error';
          if (typeof error === 'string') return error;
          if (error instanceof Error) return error.message;
          return String(error);
        },
      });
    },
  });
}
