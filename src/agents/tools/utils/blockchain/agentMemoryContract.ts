import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../../../../config/index.js';
import { wallet, provider } from './agentWallet.js';
import { cidFromBlakeHash, cidToString } from '@autonomys/auto-dag-data';
import { getLocalHash, saveHashLocally } from '../localHashStorage.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('agent-memory-contract');
const CONTRACT_ADDRESS = config.blockchainConfig.CONTRACT_ADDRESS as `0x${string}`;
const contract = new ethers.Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

export const getLastMemoryHash = async (): Promise<string> => {
  const localHash = getLocalHash();
  if (localHash) {
    logger.info('Using locally stored hash', { hash: localHash });
    return localHash;
  }

  const blockchainHash = await contract.getLastMemoryHash(wallet.address);
  if (blockchainHash) {
    saveHashLocally(blockchainHash);
  }
  return blockchainHash;
};

export const getLastMemoryCid = async (): Promise<string> => {
  const lastMemoryHash = await getLastMemoryHash();
  if (!lastMemoryHash) {
    return '';
  }
  const hashBuffer = Buffer.from(lastMemoryHash.slice(2), 'hex');

  const cid = cidFromBlakeHash(hashBuffer);
  return cidToString(cid);
};

export const setLastMemoryHash = async (hash: string, nonce?: number) => {
  const bytes32Hash = ethers.zeroPadValue(hash, 32);
  const tx = await contract.setLastMemoryHash(bytes32Hash, {
    nonce: nonce,
    gasLimit: 100000,
  });

  saveHashLocally(hash);

  const _receipt = await tx.wait();
  return tx;
};

export const getLastMemoryHashSetTimestamp = async (): Promise<number> => {
  try {
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Look back only 10000 blocks (roughly 1.5 days for Ethereum)
    // Adjust this number based on your chain and needs
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    const filter = contract.filters.LastMemoryHashSet("0x53Dd4b9627eb9691D62B90dDD987a8c8DFC99a12");
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    if (events.length === 0) {
      return 0;
    }

    // Get the last event
    const lastEvent = events[events.length - 1];
    const block = await lastEvent.getBlock();
    
    return block.timestamp;
  } catch (error) {
    logger.error('Failed to get last memory hash set timestamp', { error });
    return 0;
  }
};