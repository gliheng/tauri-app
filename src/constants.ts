import { InjectionKey, Ref } from "vue";

export const CHAT_ACTIONS = Symbol("chat-actions");
export const MESSAGE_GRAPH = Symbol("message-graph") as InjectionKey<{
  graph: Ref<Record<string, any>>;
  select: (id: string, i: number) => void;
}>;
export const ROOT_NODE_ID = "__root";

export const EDITOR_ACTIONS = Symbol("editor-actions");
