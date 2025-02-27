import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { ethers, Signer } from 'ethers';
export const logger = createLogger('evm-tools');

export const createTransferNativeTokenTool = (signer: Signer) =>
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
          value: ethers.parseEther(amount),
        });
        const receipt = await tx.wait();
        logger.info('Transferred native token - tx hash:', receipt?.hash);
        return {
          success: true,
          receiverAddress: to,
          senderAddress: await signer.getAddress(),
          txHash: receipt?.hash,
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

export const createCheckBalanceTool = (provider: ethers.Provider) =>
  new DynamicStructuredTool({
    name: 'check_balance',
    description: 'Check the balance of a specific Ethereum address',
    schema: z.object({
      address: z.string().describe('The Ethereum address to check the balance for'),
    }),
    func: async ({ address }) => {
      try {
        // Validate the address format
        if (!ethers.isAddress(address)) {
          logger.error('Invalid Ethereum address format:', address);
          return {
            success: false,
            error: 'Invalid Ethereum address format',
          };
        }

        const balance = await provider.getBalance(address);

        const formattedBalance = ethers.formatEther(balance);
        logger.info('Balance checked', { address, balance: formattedBalance });
        return {
          success: true,
          address,
          balance: formattedBalance,
        };
      } catch (error: unknown) {
        logger.error('Error checking balance:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error checking balance',
        };
      }
    },
  });
