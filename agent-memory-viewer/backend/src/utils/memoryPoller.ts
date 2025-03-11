import { config } from '../config/index.js';
import { createLogger } from './logger.js';
import { getLastMemoryHash } from './agentMemoryContract.js';
import { downloadMemory } from './dsn.js';
import { saveMemoryRecord, getMemoryByCid } from '../db/index.js';

const logger = createLogger('memoryPoller');

// Default polling interval (in milliseconds)
const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds

// Maximum depth for chain traversal to prevent infinite loops
const MAX_CHAIN_DEPTH = 20;

/**
 * Process a memory update for a specific agent, including any missed chain links
 * @param agent The agent address
 * @param cid The CID of the memory to process
 * @returns 
 */
async function processMemoryUpdate(agent: string, cid: string): Promise<void> {
  try {
    logger.info('Processing memory update', { agent, cid });
    
    // Check if this CID is already in the database
    const existingMemory = await getMemoryByCid(cid);
    if (existingMemory) {
      logger.info('Memory already processed, skipping', { agent, cid });
      return;
    }
    
    // Get the chain of memories to process
    const memoryChain = await traverseMemoryChain(agent, cid);
    
    if (memoryChain.length === 0) {
      logger.info('No new memories to process', { agent, cid });
      return;
    }
    
    // Process the chain in chronological order (oldest first)
    for (const memoryCid of memoryChain.reverse()) {
      await processMemoryCid(agent, memoryCid);
    }
    
  } catch (error) {
    logger.error('Error processing memory update', {
      error,
      agent,
      cid,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
}

/**
 * Process a single memory CID
 * @param agent The agent address
 * @param cid The CID to process
 */
async function processMemoryCid(agent: string, cid: string): Promise<void> {
  try {
    logger.info('Processing individual memory', { agent, cid });
    
    // Check if already in database before processing
    const existingMemory = await getMemoryByCid(cid);
    if (existingMemory) {
      logger.info('Memory already in database, skipping', { agent, cid });
      return;
    }
    
    const memory = await downloadMemory(cid);
    if (memory) {
      const agentConfig = config.AGENTS.find(
        a => a.address.toLowerCase() === agent.toLowerCase(),
      );
      
      const savedMemory = await saveMemoryRecord(
        cid,
        memory.memoryData,
        memory.memoryData?.previousCid,
        agentConfig?.username || 'unknown_agent',
      );
      
      logger.info('Memory processed successfully', {
        cid,
        agent: agentConfig?.username || 'unknown_agent',
        isNew: savedMemory.created_at === savedMemory.created_at,
      });
    }
  } catch (error) {
    logger.error('Error processing individual memory', {
      error,
      agent,
      cid,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
}

/**
 * Traverse the memory chain to find all unprocessed memories
 * @param agent The agent address
 * @param startCid The CID to start traversal from
 * @returns Array of CIDs to process, in reverse chronological order (newest first)
 */
async function traverseMemoryChain(agent: string, startCid: string): Promise<string[]> {
  const unprocessedCids: string[] = [];
  let currentCid = startCid;
  let depth = 0;
  
  logger.info('Traversing memory chain', { 
    agent, 
    startCid
  });
  
  // Traverse the chain until we reach a processed memory or MAX_CHAIN_DEPTH
  while (currentCid && depth < MAX_CHAIN_DEPTH) {
    // Check if this CID exists in the database
    const existingMemory = await getMemoryByCid(currentCid);
    
    if (existingMemory) {
      logger.info('Found existing memory in chain, stopping traversal', { 
        agent, 
        cid: currentCid,
        depth
      });
      break; // We've found a CID that's already processed
    }
    
    unprocessedCids.push(currentCid);
    
    try {
      const memory = await downloadMemory(currentCid);
      if (!memory || !memory.memoryData?.previousCid) {
        logger.info('Reached end of chain or invalid memory', {
          agent,
          cid: currentCid,
          depth
        });
        break; // End of chain or invalid memory
      }
      
      currentCid = memory.memoryData.previousCid;
      depth++;
      
      logger.debug('Chain traversal step', { depth, currentCid });
    } catch (error) {
      logger.error('Error during chain traversal', {
        error,
        agent,
        cid: currentCid,
        depth,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
      break;
    }
  }
  
  logger.info('Memory chain traversal complete', { 
    agent, 
    foundCids: unprocessedCids.length,
    depth 
  });
  
  return unprocessedCids;
}

/**
 * Poll for memory updates for a single agent
 * @param agent The agent configuration 
 */
async function pollAgentMemory(agent: { username: string; address: string }): Promise<void> {
  try {
    const cid = await getLastMemoryHash(agent.address);
    if (cid) {
      await processMemoryUpdate(agent.address, cid);
    }
  } catch (error) {
    logger.error('Error polling memory for agent', {
      error,
      agent: agent.username,
      address: agent.address,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
}

/**
 * Poll for memory updates for all registered agents in parallel
 */
export async function pollAllAgents(): Promise<void> {
  try {
    logger.info('Polling for memory updates for all agents in parallel');
    
    // Create an array of promises to process all agents in parallel
    const pollingPromises = config.AGENTS.map(agent => pollAgentMemory(agent));
    
    // Wait for all agent polling to complete
    await Promise.all(pollingPromises);
    
    logger.info('Completed polling for all agents');
  } catch (error) {
    logger.error('Error in memory polling', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
}

/**
 * Start the memory polling service
 * @param interval The polling interval in milliseconds
 * @returns A function to stop the polling
 */
export function startMemoryPolling(interval = DEFAULT_POLLING_INTERVAL): () => void {
  logger.info(`Starting memory polling service with interval ${interval}ms`);
  
  // Poll immediately when starting
  pollAllAgents().catch(error => {
    logger.error('Error in initial memory polling', { error });
  });
  
  // Set up regular polling
  const intervalId = setInterval(() => {
    pollAllAgents().catch(error => {
      logger.error('Error in scheduled memory polling', { error });
    });
  }, interval);
  
  // Return cleanup function
  return () => {
    logger.info('Stopping memory polling service');
    clearInterval(intervalId);
  };
} 