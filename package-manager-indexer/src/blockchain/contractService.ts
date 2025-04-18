import { ethers } from 'ethers';
import AutonomysPackageRegistryABI from './abi/AutonomysPackageRegistry.abi.json' with { type: 'json' };
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { EventCallbacks } from './types/events.js';
import { setupEventListeners } from './handlers/eventListeners.js';
import { processHistoricalEvents } from './handlers/historicalEvents.js';
import { parseVersion } from './utils/versionUtils.js';

// Re-export types and utilities for external use
export * from './types/events.js';
export { parseVersion } from './utils/versionUtils.js';

const logger = createLogger('contract-service');

/**
 * Initialize the contract instance
 * @returns Provider and contract objects
 */
export const initContract = () => {
  try {
    logger.info('Initializing contract connection');

    const provider = new ethers.WebSocketProvider(config.RPC_URL);
    const contract = new ethers.Contract(
      config.CONTRACT_ADDRESS,
      AutonomysPackageRegistryABI,
      provider,
    );

    logger.info('Contract connection initialized successfully');

    return { provider, contract };
  } catch (error) {
    logger.error('Failed to initialize contract connection:', error);
    throw error;
  }
};

/**
 * Main indexing function - processes historical events and sets up real-time listeners
 * @param contract Contract instance
 * @param fromBlock Starting block number
 * @param callbacks Event callbacks
 * @returns A cleanup function to remove all listeners
 */
export const startIndexing = async (
  contract: ethers.Contract,
  fromBlock: number,
  callbacks: EventCallbacks,
): Promise<() => void> => {
  // Process historical events first
  const latestProcessedBlock = await processHistoricalEvents(contract, fromBlock, callbacks);

  // Then setup listeners for real-time events
  return setupEventListeners(contract, latestProcessedBlock + 1, callbacks);
};
