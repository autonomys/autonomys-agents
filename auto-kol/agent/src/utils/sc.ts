import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { wallet } from './agentWallet.js';


const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;

const contract = new ethers.Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

export async function getLastMemoryHash(): Promise<string> {
    return await contract.getLastMemoryHash(wallet.address);
}

export async function setLastMemoryHash(hash: string) {
    const tx = await contract.setLastMemoryHash(hash);
    const receipt = await tx.wait();
    return receipt;
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

