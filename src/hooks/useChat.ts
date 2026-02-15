import {
  UIMessage,
  streamText,
  convertToModelMessages,
  ChatTransport,
  ChatInit,
  stepCountIs,
  generateId,
} from "ai";
import { Chat } from "@ai-sdk/vue";
import { getModel } from "@/llm";
import { updateChat, writeChat, writeMessages } from "@/db";
import { generateTopic } from "@/llm/prompt";
import { useTabsStore } from "@/stores/tabs";
import { tavilySearchTool, tavilyExtractTool } from "@/llm/tools/tavily";
import { eventBus } from "@/utils/eventBus";
import { convertMcpToolsToAiSdk } from "@/mcp/tools";


export class ChatSdkTransport implements ChatTransport<UIMessage> {
  async sendMessages(options: {
    trigger?: string;
    chatId?: string;
    messageId?: string;
    messages: UIMessage[];
    abortSignal?: AbortSignal;
    body?: Record<string, any>;
  }) {
    const { messages, body } = options;
    const prevAssistantMessage = messages[messages.length - 2];
    const userMessage = messages[messages.length - 1];
    const webSearch = body?.webSearch === true;
    const selectedMcpServers = body?.mcpServers as string[] || [];
    const chatId = options.chatId!;

    // Convert MCP tools to AI SDK format (only from selected servers)
    const mcpTools = await convertMcpToolsToAiSdk(selectedMcpServers);

    // Async update chat meta data
    (async () => {
      if (messages.length === 1) {
        const message = messages[0] as any;
        const { text: topic } = await generateTopic((
          await convertToModelMessages([message])
        )[0]);
        await writeChat({
          id: chatId,
          topic,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        eventBus.emit("chat_created", { id: chatId, topic });
        useTabsStore().setTitle(`/chat/${chatId}`, topic);
      } else {
        await updateChat(chatId, {
          updatedAt: new Date(),
        });
        eventBus.emit("chat_updated", { id: chatId });
      }
    })();

    // Merge all tools
    const allTools = {
      ...(webSearch ? {
        web_search: tavilySearchTool,
        web_extract: tavilyExtractTool,
      } : {}),
      ...mcpTools,
    };

    const result = streamText({
      model: getModel(body?.model),
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(30),
      tools: Object.keys(allTools).length > 0 ? allTools : undefined,
      abortSignal: options.abortSignal,
    });

    // Return the full stream as ReadableStream
    return result.toUIMessageStream({
      sendFinish: true,
      sendReasoning: true,
      sendSources: true,
      sendStart: true,
      generateMessageId: generateId,
      async onFinish({ messages }) {
        await writeMessages(chatId, [userMessage, ...messages], prevAssistantMessage?.id);
      },
      onError(error) {
        if (error == null) return 'unknown error';
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        return String(error);
      },
    });
  }

  async reconnectToStream(_options: any) {
    return null;
  }
}

export function useChat(opts: {
  id: string;
  initialMessages?: UIMessage[];
  onFinish?: ChatInit<UIMessage>["onFinish"];
}) {
  return new Chat({
    id: opts.id,
    messages: opts.initialMessages,
    onFinish: opts.onFinish,
    transport: new ChatSdkTransport(),
  });
}
