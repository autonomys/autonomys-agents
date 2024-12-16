import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { wallet } from './agentWallet.js';


const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;

const contract = new ethers.Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

export async function getLastMemoryHash(): Promise<string> {
    return await contract.getLastMemoryHash(wallet.address);
}

export async function setLastMemoryHash(hash: string, nonce?: number) {
    const bytes32Hash = ethers.zeroPadValue(hash, 32);
    const tx = await contract.setLastMemoryHash(bytes32Hash, { nonce: nonce });
    return tx;
}