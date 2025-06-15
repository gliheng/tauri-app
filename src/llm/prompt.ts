import { generateText } from "ai";
import { getModel } from ".";
import dedent from "dedent";

export async function generateTopic(userInput: string) {
  return generateText({
    model: getModel(),
    system: dedent`
      You are a helpful assistant that summarizes topics based on user input.
      - Topic must be concise and relevant.
      - Topic must be in the same language as user input.
      - Output only the topic with no additional formatting.
    `,
    messages: [{ role: "user", content: userInput }],
  });
}
