import { createMcpClientTool, McpTool } from '../mcp-tool/index.js';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';

export const createFirecrawlTools = async (apiKey: string): Promise<McpTool[]> => {
  const firecrawlServerParams: StdioServerParameters = {
    command: process.execPath,
    args: ['node_modules/.bin/firecrawl-mcp'],
    env: {
      FIRECRAWL_API_KEY: apiKey,
    },
  };
  const tools = await createMcpClientTool('firecrawl-mcp', '0.0.1', firecrawlServerParams);
  return tools;
};
