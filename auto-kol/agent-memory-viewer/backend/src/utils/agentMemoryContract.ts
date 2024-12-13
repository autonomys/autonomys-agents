import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { wallet } from './agentWallet.js';
import { cidFromBlakeHash } from '@autonomys/auto-dag-data';


const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;

const contract = new ethers.Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

export async function getLastMemoryHash(): Promise<string> {
    const hash = await contract.getLastMemoryHash(wallet.address);
    const bytes = ethers.getBytes(hash);
    const cid = cidFromBlakeHash(Buffer.from(bytes));
    return cid.toString();
}

export function watchMemoryHashUpdates(
    agentAddress: string,
    callback: (agent: string, hash: string) => void
) {
    const filter = contract.filters.LastMemoryHashSet(agentAddress);
    contract.on(filter, (agent: any, hash: any) => {
        if (agent === agentAddress) {
            callback(agent, hash);
        }
    });
    
    return () => {
        contract.off(filter);
    };
}

