import { ref } from "vue";
import { getAgentConfig } from "@/llm";
import { Agent } from "@/db-sqlite";
import PermissionModal from "@/components/AgentChat/PermissionModal.vue";
import { TauriACPClient } from "@/services/acp";
import type { Message, Status, Mode, Model, AvailableCommand } from "@/services/acp";

export function useAcp({ chatId, agent, onInvoke, onConnect, onDisconnect }: {
  chatId: string,
  agent: Agent,
  onInvoke?: (method: string, params: any) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
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

  const { useCustomModel, ...modelConfig } = getAgentConfig(agent.program);
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
    {
      programId,
      model,
      directory: agent.directory,
      onConnect,
      onDisconnect,
      onInvoke,
    },
    (options) => permissionModal.open(options),
  );

  return {
    client,
    ...state,
  };
}
