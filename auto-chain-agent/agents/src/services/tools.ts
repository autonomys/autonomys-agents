import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../logger';
import { activate, activateWallet, generateWallet } from '@autonomys/auto-utils';
import { balance, transfer, account } from '@autonomys/auto-consensus';
import { formatTokenValue, toShannons } from './utils';
import { config } from '../config';


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
        description: "Get the balance details of a blockchain address",
        schema: z.object({
            address: z.string().describe("The blockchain address to check balance for")
        })
    }
);

export const sendTransactionTool = tool(
    async (input: { to: string; amount: string }) => {
        try {
            logger.info(`Sending ${input.amount} to ${input.to}`);

            // Convert amount to proper format
            const formattedAmount = toShannons(input.amount);
            logger.info(`Formatted amount: ${formattedAmount}`);

            // Use test wallet
            const { api, accounts } = await activateWallet({
                uri: config.MNEMONIC,
                networkId: config.NETWORK
            });

            const sender = accounts[0];
            logger.info(`Sending from test wallet address: ${sender.address} to ${input.to} amount ${formattedAmount}`);

            // Create transfer transaction
            const tx = transfer(api, input.to, formattedAmount);

            const txHash: { 
                status: string, 
                hash: string, 
                block: string, 
                from: string, 
                to: string, 
                amount: string 
            } = await new Promise((resolve, reject) => {
                tx.signAndSend(sender, ({ status, txHash }) => {
                    if (status.isInBlock) {
                        resolve({
                            status: 'in_block',
                            hash: txHash.toString(),
                            block: status.asInBlock.toString(),
                            from: sender.address,
                            to: input.to,
                            amount: input.amount
                        });
                        api.disconnect();
                    }
                }).catch((error) => {
                    api.disconnect();
                    reject(error);
                });
            });

            return {
                status: 'success',
                hash: txHash.hash,
                block: txHash.block,
                from: sender.address,
                to: input.to,
                amount: input.amount,
                formattedAmount
            };
        } catch (error) {
            logger.error('Error sending transaction:', error);
            throw error;
        }
    },
    {
        name: "send_transaction",
        description: "Send a transaction on the blockchain using a test wallet. Amount should be specified in AI3 units (e.g., '1 ai3')",
        schema: z.object({
            to: z.string().describe("The recipient's blockchain address"),
            amount: z.string().describe("The amount to send in AI3 units (e.g., '1 ai3')")
        })
    }
);

export const getTransactionHistoryTool = tool(
    async (input: { address: string }) => {
        try {
            logger.info(`Getting transaction history for: ${input.address}`);

            // Activate the API connection
            const api = await activate({ networkId: config.NETWORK });

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

export const createWalletTool = tool(
    async () => {
        try {
            const wallet = await generateWallet();

            return {
                address: wallet.keyringPair?.address,
                publicKey: wallet.keyringPair?.publicKey.toString(),
                mnemonic: wallet.mnemonic
            };
        } catch (error) {
            logger.error('Error creating wallet:', error);
            throw error;
        }
    },
    {
        name: "create_wallet",
        description: "Create a new wallet",
        schema: z.object({})
    }
);

export const blockchainTools = [
    getBalanceTool,
    sendTransactionTool,
    getTransactionHistoryTool,
    createWalletTool
];
