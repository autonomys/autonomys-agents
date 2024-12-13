import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { wallet } from './agentWallet.js';
import { cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { createLogger } from './logger.js';

const logger = createLogger('agentMemoryContract');

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;

const contract = new ethers.Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

function hashToCid(hash: string) {
    const bytes = ethers.getBytes(hash);
    const cid = cidFromBlakeHash(Buffer.from(bytes));
    return cid.toString();
}

export async function getLastMemoryHash(): Promise<string> {
    const hash = await contract.getLastMemoryHash(wallet.address);
    return hashToCid(hash);
}

export function watchMemoryHashUpdates(
    callback: (agent: string, hash: string) => void
) {
    const agentAddress = wallet.address;
    const filter = contract.filters.LastMemoryHashSet(agentAddress);
    
    logger.info('Setting up memory hash watcher', { 
        agentAddress,
        contractAddress: CONTRACT_ADDRESS
    });

    contract.on(filter, (event: any) => {
        const eventLog = event.log;
        const agent = '0x' + eventLog.topics[1].slice(26);  
        const hash = eventLog.data;
        const cid = hashToCid(hash);
        logger.info('Raw event received', { 
            agent,
            hash,
            blockNumber: eventLog.blockNumber,
            transactionHash: eventLog.transactionHash
        });

        if (agent.toLowerCase() === agentAddress.toLowerCase()) {
            callback(agent, cid);
        } else {
            logger.info('Ignoring event for different agent', { 
                eventAgent: agent, 
                ourAgent: agentAddress 
            });
        }
    });
    
    return () => {
        logger.info('Unsetting memory hash watcher');
        contract.off(filter);
    };
}

