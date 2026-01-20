import { ref } from "vue";
import { getCodeAgentConfig } from "@/llm";
import { Agent } from "@/db-sqlite";
import PermissionModal from "@/components/AgentChat/PermissionModal.vue";
import { TauriACPClient } from "@/services/acp";
import type { Message, Status, Mode, Model, AvailableCommand } from "@/services/acp";

export function useAcp({ chatId, agent, onInvoke }: {
  chatId: string,
  agent: Agent,
  onInvoke?: (method: string, params: any) => void,
}) {
  const overlay = useOverlay();
  const permissionModal = overlay.create(PermissionModal);

  const messages = ref<Message[]>([]);
  const status = ref<Status>("ready");
  const currentModeId = ref<string>('');
  const availableModes = ref<Mode[]>([]);
  const currentModelId = ref<string>('');
  const availableModels = ref<Model[]>([]);
  const availableCommands = ref<AvailableCommand[]>([]);
  const state = {
    messages,
    status,
    currentModeId,
    availableModes,
    currentModelId,
    availableModels,
    availableCommands,
  };

  const { useCustomModel, ...modelConfig } = getCodeAgentConfig(agent.program!);
  const model = useCustomModel ? {
    model: '',
    baseUrl: '',
    apiKey: '',
    ...modelConfig,
  } : undefined;
  
  console.log('Creating ACP connection for agent:', agent.program, 'chatId:', chatId, 'model:', model);
  
  const programId = agent.program! + "::" + chatId;
  const client = new TauriACPClient(
    state,
    agent,
    {
      programId,
      model,
      onConnect() {
        console.log('onConnect');
      },
      onDisconnect() {
        console.log('onDisconnect');
      },
    },
    (options) => permissionModal.open(options),
    onInvoke,
  );

  return {
    client,
    ...state,
  };
}
