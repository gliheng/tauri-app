import { tool } from 'ai';
import { z } from 'zod';
import { eventBus } from '@/utils/eventBus';

export const presentTool = tool({
  description: 'Present the final result to the user using webview',
  inputSchema: z.object({
    type: z.string().describe('The type of content to present, e.g. "html", "text"'),
    content: z.string().describe('The content to present to the user via webview.'),
  }),
  execute: async ({ type, content }) => {
    eventBus.emit('artifact', 'webview::' + type + '::' + content);
    return { type, content };
  },
});
