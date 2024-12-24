import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { wallet } from './agentWallet.js';
import { cidFromBlakeHash, cidToString } from '@autonomys/auto-dag-data';

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;

const contract = new ethers.Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

export const getLastMemoryHash = async (): Promise<string> => {
  return await contract.getLastMemoryHash(wallet.address);
};

export const getLastMemoryCid = async (): Promise<string> => {
  const lastMemoryHash = await contract.getLastMemoryHash(wallet.address);
  return cidToString(cidFromBlakeHash(lastMemoryHash));
};

export const setLastMemoryHash = async (hash: string, nonce?: number) => {
  const bytes32Hash = ethers.zeroPadValue(hash, 32);
  const tx = await contract.setLastMemoryHash(bytes32Hash, {
    nonce: nonce,
    gasLimit: 100000,
  });
  return tx;
};
