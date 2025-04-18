import { createLogger } from './utils/logger.js';
import { config } from './config/index.js';
import { initContract, startIndexing, EventCallbacks } from './blockchain/contractService.js';
import { getLastProcessedBlock } from './db/repositories/toolRepository.js';
import { startServer } from './api/server.js';
import {
  handleToolRegistered,
  handleToolUpdated,
  handleOwnershipTransferred,
  handleProcessedBlock,
} from './handlers/eventHandlers.js';

const logger = createLogger('indexer-service');

// Start the indexer
const startIndexer = async (): Promise<void> => {
  try {
    logger.info('Starting AutonomysPackageRegistry indexer');

    // Get the last processed block
    const lastProcessedBlock = await getLastProcessedBlock();

    const startBlock = lastProcessedBlock > 0 ? lastProcessedBlock : config.START_BLOCK;
    logger.info(`Starting from block ${startBlock}`);

    // Initialize contract connection
    const { contract } = initContract();

    // Create the event callbacks
    const eventCallbacks: EventCallbacks = {
      onToolRegistered: handleToolRegistered,
      onToolUpdated: handleToolUpdated,
      onOwnershipTransferred: handleOwnershipTransferred,
      onProcessedBlock: handleProcessedBlock,
    };

    // Start the API server (with configurable port)
    const apiPort = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;
    const { shutdown: shutdownApi } = startServer(apiPort);

    // Start processing events using the unified startIndexing function
    logger.info('Starting event processing...');
    const cleanupListeners = await startIndexing(contract, startBlock, eventCallbacks);

    logger.info('Indexer started successfully');

    // Set up graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down services...');
      cleanupListeners();
      shutdownApi();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start services:', error);
    process.exit(1);
  }
};

// Start the indexer and API server
startIndexer();
