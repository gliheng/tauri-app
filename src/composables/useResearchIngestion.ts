import * as acp from "@agentclientprotocol/sdk";
import { createTauriAcpConnection } from "@/lib/acp";
import { getAgentConfig } from "@/llm";
import type { Agent, ResearchResource, ResearchTopic } from "@/db";

function buildPrompt(topic: ResearchTopic, resource: ResearchResource): string {
  const sourceLine = resource.source ? `Source: ${resource.source}\n` : "";
  const contentLine = resource.content ? `Content:\n${resource.content}\n` : "";

  return [
    "Insert this resource into the zvec-backed RAG database for the given research topic.",
    "Use the ACP agent's available tools and environment to perform the ingestion.",
    "If the resource is a URL, fetch and normalize the relevant contents before storing it.",
    "If the resource is text, store the provided text as-is.",
    "When finished, reply with a short confirmation only.",
    "",
    `Research topic: ${topic.title}`,
    `Resource kind: ${resource.kind}`,
    `Resource title: ${resource.title}`,
    sourceLine + contentLine,
  ].join("\n");
}

export function useResearchIngestion() {
  async function ingestResource(topic: ResearchTopic, resource: ResearchResource, agent: Agent): Promise<void> {
    const { useCustomModel, ...modelConfig } = getAgentConfig(agent.program);
    const model = useCustomModel ? {
      model: "",
      baseUrl: "",
      apiKey: "",
      ...modelConfig,
    } : undefined;

    const programId = `${agent.program}::research-${topic.id}-${resource.id}`;
    const { connection, dispose } = await createTauriAcpConnection(
      {
        program: programId,
        model,
      },
      () => ({
        sessionUpdate: async () => {},
        requestPermission: async () => ({ outcome: { outcome: "cancelled" } }),
        readTextFile: async () => ({ content: "" }),
        writeTextFile: async () => ({}),
        createTerminal: async () => ({ terminalId: "" }),
        terminalOutput: async () => ({ output: "", truncated: false }),
        waitForTerminalExit: async () => ({ exitCode: 0, signal: null }),
        killTerminal: async () => ({}),
        releaseTerminal: async () => ({}),
      } as unknown as acp.Client),
    );

    try {
      await connection.initialize({
        protocolVersion: acp.PROTOCOL_VERSION,
        clientCapabilities: {
          fs: {
            readTextFile: true,
            writeTextFile: true,
          },
          terminal: true,
        },
        clientInfo: {
          name: "raven",
          title: "Raven",
          version: "1.0.0",
        },
      });

      const session = await connection.newSession({
        cwd: agent.directory,
        mcpServers: [],
      });

      await connection.prompt({
        sessionId: session.sessionId,
        prompt: [
          {
            type: "text",
            text: buildPrompt(topic, resource),
          },
        ],
      });
    } finally {
      await dispose();
    }
  }

  return {
    ingestResource,
  };
}
