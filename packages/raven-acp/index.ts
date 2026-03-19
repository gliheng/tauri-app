import * as acp from "@agentclientprotocol/sdk";
import { Readable, Writable } from "node:stream";
import { RavenACPAgent } from "./src/agent.ts";
import { parseCliOptions } from "./src/cli.ts";
import { formatError } from "./src/content.ts";
import { runTerminalTransport } from "./src/terminal.ts";

async function main(): Promise<void> {
  const cliOptions = parseCliOptions();

  if (cliOptions.transport === "terminal") {
    await runTerminalTransport();
    return;
  }

  // Node's `toWeb` types are wider than the ACP SDK stream signature.
  const outbound = Writable.toWeb(process.stdout) as WritableStream<Uint8Array>;
  const inbound = Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>;
  const transport = acp.ndJsonStream(outbound, inbound);

  new acp.AgentSideConnection((connection) => new RavenACPAgent(connection), transport);
}

void main().catch((error) => {
  process.stderr.write(`raven error: ${formatError(error)}\n`);
  process.exitCode = 1;
});
