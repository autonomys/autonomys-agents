import { resetLastProcessedBlock } from '../db/repositories/toolRepository.js';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const logger = createLogger('reset-indexer');

/**
 * Script to reset the indexer's last processed block.
 * This allows the indexer to start from a specific block number
 * or from the configured START_BLOCK.
 */
const resetIndexer = async () => {
  try {
    // Get the block number from command line argument, or use 0 to start from START_BLOCK
    const args = process.argv.slice(2);
    const blockNumber = args.length > 0 ? parseInt(args[0]) : 0;

    logger.info(`Resetting last processed block to ${blockNumber}`);
    await resetLastProcessedBlock(blockNumber);

    // If reset to 0, inform user about the actual start block
    if (blockNumber === 0) {
      logger.info(`Indexer will start from block ${config.START_BLOCK} on next run`);
    } else {
      logger.info(`Indexer will start from block ${blockNumber} on next run`);
    }

    logger.info('Reset complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error resetting indexer:', error);
    process.exit(1);
  }
};

// Run the reset function
resetIndexer();
