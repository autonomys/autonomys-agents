import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { Signer } from 'ethers';
export const logger = createLogger('evm-tools');

export const transferNativeToken = (signer: Signer) =>
  new DynamicStructuredTool({
    name: 'transfer_native_token',
    description: 'Transfer a native token to a specific address',
    schema: z.object({
      to: z.string(),
      amount: z.string(),
    }),
    func: async ({ to, amount }) => {
      try {
        logger.info('Transferring native token - Received data:', {
          to,
          amount,
        });
        const tx = await signer.sendTransaction({
          to,
          value: amount,
        });
        const receipt = await tx.wait();
        logger.info('Transferred native token - Receipt:', receipt);
        return {
          success: true,
          receipt,
        };
      } catch (error) {
        logger.error('Error transferring native token:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
