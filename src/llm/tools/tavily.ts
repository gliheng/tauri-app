import { tool } from 'ai';
import { z } from 'zod';
import { useSettingsStore } from '@/stores/settings';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilySearchResponse {
  query: string;
  answer: string;
  results: TavilySearchResult[];
  images: any[];
  response_time: number;
}

interface TavilyExtractResponse {
  results: Array<{
    url: string;
    raw_content: string;
  }>;
  failed_results: Array<{
    url: string;
    error: string;
  }>;
  response_time: number;
}

export const tavilySearchTool = tool({
  description: 'Search the web for current information using Tavily. Use this when you need up-to-date information or facts that may have changed recently.',
  inputSchema: z.object({
    query: z.string().describe('The search query to search for'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return (default: 5)'),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    const settingsStore = useSettingsStore();
    const apiKey = settingsStore.webSearchSettings.apiKey;

    if (!apiKey) {
      throw new Error('Tavily API key not configured. Please add your API key in Settings > Tavily Search.');
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          search_depth: 'basic',
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_image_descriptions: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.error || `Tavily API error: ${response.status}`);
      }

      const data: TavilySearchResponse = await response.json();

      // Format the results as a readable string
      const formattedResults = data.results.map((result: TavilySearchResult, index: number) => {
        return `[${index + 1}] ${result.title}
URL: ${result.url}
Content: ${result.content}
${result.published_date ? `Published: ${result.published_date}` : ''}`;
      }).join('\n\n');

      return {
        success: true,
        query: data.query,
        results: formattedResults,
        resultCount: data.results.length,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Web search failed: ${error.message}`);
      }
      throw new Error('Web search failed with unknown error');
    }
  },
});

export const tavilyExtractTool = tool({
  description: 'Extract and parse the main content from a specific URL using Tavily. Use this when you need to read the full content of a specific web page.',
  inputSchema: z.object({
    url: z.string().describe('The URL to extract content from'),
  }),
  execute: async ({ url }) => {
    const settingsStore = useSettingsStore();
    const apiKey = settingsStore.webSearchSettings.apiKey;

    if (!apiKey) {
      throw new Error('Tavily API key not configured. Please add your API key in Settings > Tavily Search.');
    }

    try {
      const response = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          urls: [url],
          extract_depth: 'basic',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.error || `Tavily API error: ${response.status}`);
      }

      const data: TavilyExtractResponse = await response.json();

      // Check if the extraction failed
      if (data.failed_results && data.failed_results.length > 0) {
        throw new Error(`Failed to extract content: ${data.failed_results[0].error}`);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No content extracted from the URL');
      }

      const result = data.results[0];

      // Format the result as a readable string
      const formattedResult = `URL: ${url}
Content:
${result.raw_content}`;

      return {
        success: true,
        result: formattedResult,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Content extraction failed: ${error.message}`);
      }
      throw new Error('Content extraction failed with unknown error');
    }
  },
});