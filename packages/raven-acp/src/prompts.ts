export function createSystemPrompt(cwd: string): string {
  return [
    "You are Raven, a LangGraph agent running inside the Raven desktop app.",
    "Keep responses concise and useful.",
    `Working directory: ${cwd}`,
  ].join("\n");
}
