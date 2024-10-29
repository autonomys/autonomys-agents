import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../logger';

export const getBalanceTool = tool(
    async (input: { address: string }) => {
        try {
            logger.info(`Getting balance for address: ${input.address}`);
            // Mock implementation - replace with actual blockchain interaction
            return `Balance for ${input.address}: 100 ETH`;
        } catch (error) {
            logger.error('Error getting balance:', error);
            throw error;
        }
    },
    {
        name: "get_balance",
        description: "Get the balance of a blockchain address",
        schema: z.object({
            address: z.string().describe("The blockchain address to check balance for")
        })
    }
);

export const sendTransactionTool = tool(
    async (input: { to: string; amount: string }) => {
        try {
            logger.info(`Sending ${input.amount} to ${input.to}`);
            // Mock implementation - replace with actual blockchain interaction
            return `Transaction sent: ${input.amount} ETH to ${input.to}`;
        } catch (error) {
            logger.error('Error sending transaction:', error);
            throw error;
        }
    },
    {
        name: "send_transaction",
        description: "Send a transaction on the blockchain",
        schema: z.object({
            to: z.string().describe("The recipient's blockchain address"),
            amount: z.string().describe("The amount of ETH to send")
        })
    }
);

export const getTransactionHistoryTool = tool(
    async (input: { address: string }) => {
        try {
            logger.info(`Getting transaction history for: ${input.address}`);
            // Mock implementation - replace with actual blockchain interaction
            return `Transaction history for ${input.address}: [Mock transactions]`;
        } catch (error) {
            logger.error('Error getting transaction history:', error);
            throw error;
        }
    },
    {
        name: "get_transaction_history",
        description: "Get transaction history for an address",
        schema: z.object({
            address: z.string().describe("The blockchain address to get history for")
        })
    }
);

// Export all tools as an array for convenience
export const blockchainTools = [
    getBalanceTool,
    sendTransactionTool,
    getTransactionHistoryTool
];
