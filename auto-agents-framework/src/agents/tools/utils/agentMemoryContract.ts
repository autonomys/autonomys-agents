import { ethers } from 'ethers';
import { MEMORY_ABI } from './abi/memory.js';
import { config } from '../../../config/index.js';
import { wallet } from './agentWallet.js';
import { cidFromBlakeHash, cidToString } from '@autonomys/auto-dag-data';
import { saveHashLocally, getLocalHash } from './localHashStorage.js';
import { createLogger } from '../../../utils/logger.js';

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
