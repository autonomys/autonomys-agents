import { ethers, Contract } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { wallet } from './agentWallet.js';
import { cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { createLogger } from './logger.js';

const logger = createLogger('agentMemoryContract');

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;
const contract = new Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

function hashToCid(hash: Uint8Array): string {
    const cid = cidFromBlakeHash(Buffer.from(hash));
    return cid.toString();
}

export async function getLastMemoryHash(): Promise<string> {
    const hash = await contract.getLastMemoryHash(config.AGENT_ADDRESS);
    return hashToCid(ethers.getBytes(hash));
}

export async function watchMemoryHashUpdates(
    callback: (agent: string, cid: string) => void
) {
    const agentAddress = config.AGENT_ADDRESS.toLowerCase();
    let isWatching = true;

    logger.info('Setting up memory hash watcher', {
        agentAddress,
        contractAddress: CONTRACT_ADDRESS,
    });

    const setupListener = async () => {
        if (!isWatching) return;

        try {
            // Create a new filter each time we set up the listener
            const filter = contract.filters.LastMemoryHashSet(agentAddress);

            contract.on(filter, (eventPayload) => {
                if (!isWatching) return;

                try {
                    const [agent, hash] = eventPayload.args;

                    if (!agent || !hash) {
                        logger.error('Missing event arguments', { eventArgs: eventPayload });
                        return;
                    }

                    const cid = hashToCid(ethers.getBytes(hash));

                    if (agent.toLowerCase() === agentAddress) {
                        callback(agent, cid);
                    }
                } catch (error) {
                    logger.error('Error processing event data', { 
                        error, 
                        eventArgs: eventPayload 
                    });
                }
            });

            if (contract.runner?.provider) {
                const provider = contract.runner.provider;

                // Handle provider errors and reconnection
                provider.on('error', async (error) => {
                    logger.error('Provider error, attempting to reconnect...', { error });
                    
                    if (isWatching) {
                        try {
                            contract.off(filter);
                        } catch (e) {
                            logger.warn('Error removing event listener', { error: e });
                        }

                        // Add exponential backoff for reconnection attempts
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        setupListener();
                    }
                });

                // Periodically refresh the filter to prevent expiration
                const refreshInterval = setInterval(async () => {
                    if (!isWatching) {
                        clearInterval(refreshInterval);
                        return;
                    }

                    try {
                        // Re-create the filter
                        contract.off(filter);
                        await setupListener();
                    } catch (error) {
                        logger.error('Error refreshing filter', { error });
                    }
                }, 4 * 60 * 1000); // Refresh every 4 minutes
            } else {
                logger.warn('Runner or provider is null, reconnection logic may not work.');
            }
        } catch (error) {
            logger.error('Error setting up event listener', { error });
            
            // Retry setup after delay if still watching
            if (isWatching) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                setupListener();
            }
        }
    };

    await setupListener();

    return () => {
        isWatching = false;
        try {
            contract.removeAllListeners();
        } catch (error) {
            logger.warn('Error while removing event listeners', { error });
        }
    };
}
