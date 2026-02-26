/**
 * MCP to AI SDK Tool Conversion
 *
 * This module converts MCP tool definitions to AI SDK tool format.
 */
import z from 'zod'
import { useMcpStore } from '@/stores/mcp';

/**
 * AI SDK tool definition
 */
export interface AiSdkTool {
  description: string
  inputSchema: z.ZodType<any>
  execute: (args: any) => Promise<any>
}

/**
 * Convert MCP tools to AI SDK format
 *
 * @param serverIds - Optional filter to only include tools from these servers
 * @returns Map of tool name to AI SDK tool definition
 */
export async function convertMcpToolsToAiSdk(serverIds?: string[]): Promise<Record<string, AiSdkTool>> {
  const tools: Record<string, AiSdkTool> = {}
  const mcpStore = useMcpStore()
  const connections = mcpStore.getAllConnections()

  // Filter connections by selected server IDs if provided
  const filteredConnections = serverIds
    ? connections.filter(c => serverIds.includes(c.serverId))
    : connections

  for (const connection of filteredConnections) {
    const mcpTools = mcpStore.getTools(connection.serverId)

    for (const tool of mcpTools) {
      // Prefix tool name with server ID to avoid collisions
      const prefixedName = `${connection.serverId}__${tool.name}`

      tools[prefixedName] = {
        description: tool.description || `Tool: ${tool.name}`,
        inputSchema: z.fromJSONSchema(tool.input_schema ?? {}),
        execute: async (args: any) => {
          try {
            const result = await mcpStore.callTool(connection.serverId, tool.name, args)
            return result
          } catch (error) {
            console.error(`[MCP] Error calling tool ${prefixedName}:`, error)
            throw error
          }
        },
      }
    }
  }

  return tools
}

/**
 * Format tool response for AI SDK
 *
 * MCP tools return complex response objects with content arrays.
 * This extracts the text content for the AI.
 */
export function formatMcpToolResponse(response: any): string {
  if (!response) {
    return ''
  }

  // Handle text content
  if (response.content) {
    if (Array.isArray(response.content)) {
      return response.content
        .map((item: any) => {
          if (item.type === 'text') {
            return item.text
          }
          if (item.type === 'resource') {
            return `[Resource: ${item.resource.uri}]`
          }
          return JSON.stringify(item)
        })
        .join('\n')
    }
    if (typeof response.content === 'string') {
      return response.content
    }
  }

  // Fallback to JSON string
  return JSON.stringify(response)
}
