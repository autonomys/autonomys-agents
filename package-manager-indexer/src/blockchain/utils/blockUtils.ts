import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { EventCallbacks } from '../types/events.js';
import { retryOperation } from './retryUtils.js';

const logger = createLogger('block-utils');

// Track the last processed block number for continuity verification
let lastProcessedBlockNumber: number = 0;

/**
 * Initializes the last processed block number for continuity tracking
 * @param blockNumber The block number to initialize with
 */
export const initLastProcessedBlock = (blockNumber: number): void => {
  lastProcessedBlockNumber = blockNumber;
  logger.info(`Initialized last processed block to ${blockNumber}`);
};

/**
 * Get the current last processed block number
 * @returns The last processed block number
 */
export const getLastProcessedBlockNumber = (): number => {
  return lastProcessedBlockNumber;
};

/**
 * Verify block continuity and handle missing blocks
 * @param currentBlockNumber Current block number
 * @param contract Contract instance
 * @param callbacks Event callbacks
 * @param processBlockFn Function to process a single block
 */
export const verifyBlockContinuity = async (
  currentBlockNumber: number,
  contract: ethers.Contract,
  callbacks: EventCallbacks,
  processBlockFn: (
    blockNumber: number,
    contract: ethers.Contract,
    callbacks: EventCallbacks,
  ) => Promise<void>,
): Promise<void> => {
  // Initialize lastProcessedBlockNumber if it's still 0
  if (lastProcessedBlockNumber === 0) {
    lastProcessedBlockNumber = currentBlockNumber - 1;
    return;
  }

  // Check if the current block is exactly one more than the last processed block
  if (currentBlockNumber > lastProcessedBlockNumber + 1) {
    logger.warn(
      `Detected missing block(s) between ${lastProcessedBlockNumber} and ${currentBlockNumber}`,
    );

    // Process all missing blocks in sequential order
    for (
      let missingBlock = lastProcessedBlockNumber + 1;
      missingBlock < currentBlockNumber;
      missingBlock++
    ) {
      logger.info(`Attempting to recover missing block ${missingBlock}`);

      try {
        // Use retry operation to fetch and process the missing block
        await retryOperation(
          async () => {
            // Get block by number with retry
            const provider = contract.runner as ethers.Provider;
            const block = await provider.getBlock(missingBlock, true);

            if (!block) {
              throw new Error(`Failed to retrieve block ${missingBlock}`);
            }

            logger.info(`Successfully recovered missing block ${missingBlock}`);

            // Process all events in the recovered block
            await processBlockFn(missingBlock, contract, callbacks);

            return block;
          },
          5,
          1000,
          2,
        ); // More aggressive retry for missing blocks: 5 retries, starting at 1s
      } catch (error) {
        logger.error(
          `Failed to recover missing block ${missingBlock} after multiple retries:`,
          error,
        );
      }
    }
  }

  // Update the last processed block number
  lastProcessedBlockNumber = currentBlockNumber;
};
