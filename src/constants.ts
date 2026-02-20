import { InjectionKey, Ref } from "vue";
import { FileUIPart, UIMessage } from "ai";
import { Chat } from "@ai-sdk/vue";

export const CHAT_ACTIONS = Symbol("chat-actions") as InjectionKey<{
  chat: Chat<UIMessage>;
  regenerate: () => Promise<void>;
  sendMessage: (message: {
    text: string;
    files?: FileUIPart[];
    body?: Record<string, any>,
  }) => Promise<void>;
}>;
export const MESSAGE_GRAPH = Symbol("message-graph") as InjectionKey<{
  graph: Ref<Record<string, any>>;
  select: (id: string, i: number) => void;
}>;
export const ROOT_NODE_ID = "__root";

export const SUPABASE_URL = "https://xgazvyjwnjwablelrrsc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_wbwXXEx1TFLEz7zKTFHkOQ_HQaHIwAF";

export const EDITOR_ACTIONS = Symbol("editor-actions");
