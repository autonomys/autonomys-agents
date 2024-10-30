import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../logger';
import { activate, activateWallet } from '@autonomys/auto-utils';
import { balance, transfer, account } from '@autonomys/auto-consensus';

const formatTokenValue = (tokenValue: bigint, decimals: number = 18) => {
    return Number(tokenValue) / 10 ** decimals;
};

export const getBalanceTool = tool(
    async (input: { address: string }) => {
        try {
            logger.info(`Getting balance for address: ${input.address}`);
            const api = await activate({ networkId: 'taurus' });
            const accountBalance = await balance(api, input.address);
            await api.disconnect();
            const formattedBalance = formatTokenValue(accountBalance.free);
            logger.info(`Balance for address ${input.address}: ${formattedBalance}`);

            return {
                address: input.address,
                balance: formattedBalance
            };
        } catch (error) {
            logger.error('Error getting balance:', error);
            throw error;
        }
    },
    {
        name: "get_balance",
        description: "Get the balance details of a blockchain address. Returns an object containing the address and balance information (free and reserved balances).",
        schema: z.object({
            address: z.string().describe("The blockchain address to check balance for")
        })
    }
);

export const sendTransactionTool = tool(
    async (input: { to: string; amount: string; mnemonic: string }) => {
        try {
            logger.info(`Sending ${input.amount} to ${input.to}`);

            // Activate wallet with provided mnemonic
            const { api, accounts } = await activateWallet({
                mnemonic: input.mnemonic,
                networkId: 'taurus'
            });

            const sender = accounts[0];

            // Create transfer transaction
            const tx = await transfer(api, input.to, input.amount);

            // Sign and send the transaction
            return new Promise((resolve, reject) => {
                tx.signAndSend(sender, ({ status, txHash }) => {
                    if (status.isInBlock) {
                        resolve(`Transaction included in block. Hash: ${txHash}`);
                        api.disconnect();
                    } else if (status.isFinalized) {
                        resolve(`Transaction finalized. Hash: ${txHash}`);
                        api.disconnect();
                    }
                }).catch((error) => {
                    api.disconnect();
                    reject(error);
                });
            });
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
            amount: z.string().describe("The amount to send"),
            mnemonic: z.string().describe("The sender's mnemonic phrase")
        })
    }
);

export const getTransactionHistoryTool = tool(
    async (input: { address: string }) => {
        try {
            logger.info(`Getting transaction history for: ${input.address}`);

            // Activate the API connection
            const api = await activate({ networkId: 'gemini-3h' });

            // Get account information including nonce (transaction count)
            const accountInfo = await account(api, input.address);

            // Format the response
            const response = `Account ${input.address}:
                Nonce (Transaction Count): ${accountInfo.nonce}
                Free Balance: ${accountInfo.data.free}
                Reserved Balance: ${accountInfo.data.reserved}`;

            await api.disconnect();
            return response;
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
