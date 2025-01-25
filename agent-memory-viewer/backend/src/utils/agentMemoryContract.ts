import { ethers, Contract } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { createLogger } from './logger.js';

const logger = createLogger('agentMemoryContract');

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;
const wsProvider = new ethers.WebSocketProvider(config.WS_RPC_URL);
const wallet = ethers.Wallet.createRandom(wsProvider);
const contract = new Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

function hashToCid(hash: Uint8Array): string {
  const cid = cidFromBlakeHash(Buffer.from(hash));
  return cid.toString();
}

export async function getLastMemoryHash(agentAddress: string): Promise<string> {
  const hash = await contract.getLastMemoryHash(agentAddress);
  return hashToCid(ethers.getBytes(hash));
}

export async function watchMemoryHashUpdates(callback: (agent: string, cid: string) => void) {
  const agentAddresses = config.AGENTS.map(a => a.address.toLowerCase());
  const eventName = 'LastMemoryHashSet';

  logger.info('Setting up memory hash watcher with WebSocketProvider', {
    agentAddresses,
    contractAddress: config.CONTRACT_ADDRESS,
  });

  const listener = (agent: string, hash: string) => {
    try {
      const cid = hashToCid(ethers.getBytes(hash));
      if (agentAddresses.includes(agent.toLowerCase())) {
        callback(agent, cid);
      }
    } catch (error) {
      logger.error('Error processing event data', { error });
    }
  };

  contract.on(eventName, listener);

  logger.info(`Listening for ${eventName} events over WebSocket.`);

  return async () => {
    contract.off(eventName, listener);
    logger.info('Memory hash watcher stopped.');
  };
}
