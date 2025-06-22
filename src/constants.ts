import { InjectionKey, Ref } from "vue";

export const CHAT_ACTIONS = Symbol("chat-actions");
export const MESSAGE_GRAPH = Symbol("message-graph") as InjectionKey<{
  graph: Ref<Record<string, any>>;
  select: (id: string, i: number) => void;
}>;
