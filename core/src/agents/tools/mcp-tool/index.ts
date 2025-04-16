import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  StdioServerParameters,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { loadMcpTools } from '@langchain/mcp-adapters';
import { StructuredToolInterface } from '@langchain/core/tools';

export const createMcpClientTool = async (
  clientName: string,
  clientVersion: string,
  serverParams: StdioServerParameters,
): Promise<StructuredToolInterface[]> => {
  const transport = new StdioClientTransport(serverParams);
  const client = new Client({
    name: clientName,
    version: clientVersion,
  });

  client.connect(transport);

  const tools = await loadMcpTools(clientName, client);

  return tools;
};
