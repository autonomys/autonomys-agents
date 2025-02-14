import { ethers } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../../../../config/index.js';
import { provider, wallet } from './agentWallet.js';
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

export const getLastMemoryHashSetTimestamp = async (): Promise<{
  timestamp: number;
  hash: string;
}> => {
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 5000);

    const filter = contract.filters.LastMemoryHashSet(wallet.address);
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);

    if (events.length === 0) {
      return { timestamp: 0, hash: '' };
    }
    const lastEvent = events[events.length - 1];
    const block = await lastEvent.getBlock();

    return {
      timestamp: block.timestamp,
      hash: (lastEvent as ethers.EventLog).args.hash,
    };
  } catch (error) {
    logger.error('Failed to get last memory hash set timestamp', { error });
    return { timestamp: 0, hash: '' };
  }
};
