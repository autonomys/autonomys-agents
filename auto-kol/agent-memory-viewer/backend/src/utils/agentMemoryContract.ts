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

    const filter = await contract.filters.LastMemoryHashSet(agentAddress);

    let isWatching = true;

    logger.info('Setting up memory hash watcher', {
        agentAddress,
        contractAddress: CONTRACT_ADDRESS,
    });

    const setupListener = () => {
        if (!isWatching) return;

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

        if (contract.runner && contract.runner.provider) {
            const provider = contract.runner.provider;

            provider.on('error', (error: Error) => {
                logger.error('WebSocket error, attempting to reconnect...', { error });

                setTimeout(() => {
                    if (isWatching) {
                        contract.off(filter);
                        setupListener();
                    }
                }, 5000);
            });
        } else {
            logger.warn('Runner or provider is null, reconnection logic may not work.');
        }
    };

    setupListener();

    return () => {
        isWatching = false;
        try {
            contract.off(filter);
        } catch (error) {
            logger.warn('Error while removing event listener', { error });
        }
    };
}
