import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  StdioServerParameters,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { loadMcpTools } from '@langchain/mcp-adapters';

export const createMcpClientTool = async (
  clientName: string,
  clientVersion: string,
  serverParams: StdioServerParameters,
) => {
  const transport = new StdioClientTransport(serverParams);
  const client = new Client({
    name: clientName,
    version: clientVersion,
  });

  client.connect(transport);

  const tools = await loadMcpTools(clientName, client);

  return tools;
};
