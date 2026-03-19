import yargs from "yargs";
import type { CliOptions } from "./types.ts";

export function parseCliOptions(argv: string[] = process.argv): CliOptions {
  const parsed = yargs(argv.slice(2))
    .scriptName("raven-acp")
    .exitProcess(false)
    .help(false)
    .version(false)
    .option("transport", {
      alias: "t",
      choices: ["acp", "terminal"] as const,
      default: "terminal" as const,
      description: "Protocol adapter to use for stdin/stdout",
      type: "string",
    })
    .parseSync();
  const transport = parsed.transport === "acp" ? "acp" : "terminal";

  return {
    transport,
  };
}
