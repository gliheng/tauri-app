<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { AnimatePresence, motion } from 'motion-v';
import { getAgent, type Agent } from "@/db";
import { nanoid } from "nanoid";
import { getModelConfig } from "@/llm";
import { ACPService } from "@/services/acp";
import AgentSessionList from "@/components/AgentSessionList.vue";

const route = useRoute();
const agentId = route.params.id as string;
const chatId = ref(nanoid());
const initialData = await getAgent(agentId);

const agent = ref<Agent>({
  id: agentId,
  name: initialData?.name ?? "New Agent",
  icon: initialData?.icon ?? "i-lucide-sticky-note",
  type: initialData?.type ?? "chat",
  instructions: initialData?.instructions,
  directory: initialData?.directory,
  program: initialData?.program ?? "codex",
  createdAt: initialData?.createdAt ?? new Date(),
  updatedAt: initialData?.updatedAt ?? new Date(),
});

const onNewSession = () => {
  chatId.value = nanoid();
}

const enableLoadSession = ref(false);
onMounted(async () => {
  const { model, apiKey, baseUrl } = getModelConfig();
  const acpService = new ACPService({ 
    program: agent.value.program!,
    directory: agent.value.directory!,
    mcpServers: [],
    model,
    baseUrl,
    apiKey,
    onConnect() {
      console.log('onConnect');
    },
    onDisconnect() {
      console.log('onDisconnect');
    },
    onInvoke(method, params) {
      console.log("Method", method, "invoked with params", params);
    },
  });
  await acpService.initialize();
  enableLoadSession.value = acpService.hasCapability("loadSession");
  await acpService.dispose();
});
</script>

<template>
  <div class="relative size-full">
    <AnimatePresence>
      <motion.div v-if="enableLoadSession" class="absolute top-2 right-2 flex items-center gap-2">
        <UPopover >
          <UButton
            icon="i-heroicons-queue-list-20-solid"
            color="neutral"
            variant="subtle"
          />
          <template #content>
            <AgentSessionList :agent-id="agentId" v-model:chat-id="chatId" @new-session="onNewSession" />
          </template>
        </UPopover>
      </motion.div>
    </AnimatePresence>
    <KeepAlive>
      <AgentChat
        :key="chatId"
        :agent="agent"
        :chat-id="chatId"
      />
    </KeepAlive>
  </div>
</template>
