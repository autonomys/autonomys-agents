import { logger } from '../agentExperiences/index.js';
import { createMcpClientTool } from '../mcp-tool/index.js';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StructuredToolInterface } from '@langchain/core/tools';

export const createNotionTools = async (
  integrationSecret: string,
): Promise<StructuredToolInterface[]> => {
  const notionServerParams: StdioServerParameters = {
    command: process.execPath,
    args: ['node_modules/.bin/notion-mcp-server'],
    env: {
      OPENAPI_MCP_HEADERS: `{\"Authorization\": \"Bearer ${integrationSecret}\", \"Notion-Version\": \"2022-06-28\" }`,
    },
  };
  const tools = await createMcpClientTool('notion-mcp', '0.0.1', notionServerParams);
  logger.debug('notionTools', { tools });
  return tools;
};
