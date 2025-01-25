import { getLastMemoryHash } from './agentMemoryContract.js';
import { saveMemoryRecord, getMemoryByCid } from '../db/index.js';
import { downloadMemory } from './dsn.js';
import { createLogger } from './logger.js';
import { config } from '../config/index.js';

const logger = createLogger('resurrection');

export async function resurrection() {
  logger.info('Starting resurrection');
  
  // Process resurrection for each configured agent
  for (const agent of config.AGENTS) {
    logger.info(`Starting resurrection for agent: ${agent.username}`);
    try {
      const hash = await getLastMemoryHash(agent.address);
      await processResurrection(hash, agent.username);
    } catch (error) {
      logger.error(`Error during resurrection for agent ${agent.username}:`, error);
    }
  }
}

async function processResurrection(startHash: string, agentName: string) {
  const memories: { hash: string; data: any }[] = [];
  let hash = startHash;

  while (true) {
    const existingMemory = await getMemoryByCid(hash);
    if (existingMemory) {
      logger.info('Found existing memory, stopping resurrection', { cid: hash });
      break;
    }

    try {
      const memory = await downloadMemory(hash);
      if (!memory) break;

      memories.push({ hash, data: memory });
      hash = memory?.previousCid;

      if (!hash) break;
    } catch (error) {
      logger.error('Failed to download memory during resurrection', {
        cid: hash,
        error,
      });
      break;
    }
  }

  for (let i = memories.length - 1; i >= 0; i--) {
    const { hash, data } = memories[i];
    try {
      await saveMemoryRecord(hash, data, data?.previousCid, agentName);
      logger.info('Saved memory during resurrection', { cid: hash, agent: agentName });
    } catch (error) {
      logger.error('Failed to save memory during resurrection', {
        cid: hash,
        agent: agentName,
        error,
      });
    }
  }

  logger.info('Resurrection complete', { 
    agent: agentName,
    memoriesProcessed: memories.length 
  });
}
