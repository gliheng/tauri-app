import { convertToCoreMessages, streamText } from "ai";
import { getModel } from "@/llm";
import { useChat as aiUseChat } from "@ai-sdk/vue";

export function useChat(opts: { id: string }) {
  return aiUseChat({
    id: opts.id,
    fetch: async (_url, req) => {
      const { messages, data } = JSON.parse(req!.body as unknown as string);
      const ret = streamText({
        model: getModel(data?.model),
        messages: convertToCoreMessages(messages),
        onChunk: (chunk) => {
          console.log(chunk);
        },
      });
      return ret.toDataStreamResponse({
        sendReasoning: true,
        sendUsage: true,
      });
    },
  });
}
