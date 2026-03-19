import { createInterface } from "node:readline";
import { formatError } from "./content.ts";
import { RavenRuntime } from "./runtime.ts";

const TERMINAL_PROMPT = "> ";
const EXIT_COMMANDS = new Set(["/exit", "/quit"]);

export async function runTerminalTransport(): Promise<void> {
  const runtime = new RavenRuntime();
  const session = runtime.createSession(process.cwd());
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: interactive,
  });

  if (interactive) {
    readline.setPrompt(TERMINAL_PROMPT);
    readline.on("SIGINT", () => {
      readline.close();
    });
    readline.prompt();
  }

  for await (const line of readline) {
    const userText = line.trim();

    if (!userText) {
      if (interactive) {
        readline.prompt();
      }
      continue;
    }

    if (EXIT_COMMANDS.has(userText)) {
      break;
    }

    try {
      const output = await runtime.prompt(session, userText);

      if (output) {
        process.stdout.write(`${output}\n`);
      }
    } catch (error) {
      process.stderr.write(`raven error: ${formatError(error)}\n`);
    }

    if (interactive) {
      process.stdout.write("\n");
      readline.prompt();
    }
  }

  readline.close();
}
