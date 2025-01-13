import { AIMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { requestTokens } from './utils/faucet.js';

const logger = createLogger('send-faucet-request-tool');

export const createSendFaucetRequestTool = () =>
  new DynamicStructuredTool({
    name: 'send_faucet_request',
    description: 'Send a request to the faucet',
    schema: z.object({ address: z.string() }),
    func: async ({ address }) => {
      try {
        logger.info('Sending faucet request - Received data:', JSON.stringify(address, null, 2));
        const result = await requestTokens(address);
        const txHash = result?.txHash;
        logger.info('Sending faucet request - Transaction:', JSON.stringify(txHash, null, 2));
        return txHash;
      } catch (error) {
        logger.error('Error sending faucet request:', error);
        throw error;
      }
    },
  });

export const invokeSendFaucetRequestTool = async (toolNode: ToolNode, address: string) => {
  logger.info('Invoking send faucet request tool with data:', JSON.stringify(address, null, 2));
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'send_faucet_request',
            args: { address },
            id: 'send_faucet_request_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
