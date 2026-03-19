import type { BaseMessage } from "@langchain/core/messages";
import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
import { initChatModel } from "langchain";
import type { ConversationGraph, RuntimeConfig } from "./types.ts";

const CALL_MODEL_NODE_ID = "callModel";

interface GraphState {
  cwd: string;
  messages: BaseMessage[];
}

interface ChatModel {
  invoke(input: BaseMessage[]): Promise<BaseMessage>;
}

function createCallModelNode(model: ChatModel): (state: GraphState) => Promise<GraphState> {
  return async (state: GraphState): Promise<GraphState> => {
    const response = await model.invoke(state.messages);

    return {
      cwd: state.cwd,
      // MessagesAnnotation appends node outputs onto the running conversation.
      messages: [response],
    };
  };
}

export async function createGraph(config: RuntimeConfig): Promise<ConversationGraph> {
  const model = await initChatModel(config.model, {
    modelProvider: config.modelProvider,
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    temperature: 0,
  });

  const callModelNode = createCallModelNode(model);

  return new StateGraph(MessagesAnnotation)
    .addNode(CALL_MODEL_NODE_ID, callModelNode)
    .addEdge(START, CALL_MODEL_NODE_ID)
    .addEdge(CALL_MODEL_NODE_ID, END)
    .compile();
}
