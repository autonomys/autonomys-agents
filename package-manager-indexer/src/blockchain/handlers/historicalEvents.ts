import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { EventCallbacks } from '../types/events.js';
import { retryOperation } from '../utils/retryUtils.js';
import { verifyBlockContinuity, initLastProcessedBlock } from '../utils/blockUtils.js';
import {
  extractNameFromTransaction,
  extractMetadataHashFromTransaction,
} from '../utils/transactionUtils.js';
import { processBlock } from './processBlock.js';

const logger = createLogger('historical-events');

/**
 * Process historical events in batches
 * @param contract Contract instance
 * @param fromBlock Starting block number
 * @param callbacks Event callbacks
 * @returns The highest block processed
 */
export const processHistoricalEvents = async (
  contract: ethers.Contract,
  fromBlock: number,
  callbacks: EventCallbacks,
): Promise<number> => {
  try {
    const provider = contract.runner as ethers.WebSocketProvider;

    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    logger.info(`Current blockchain height is block ${currentBlock}`);

    if (fromBlock >= currentBlock) {
      logger.info('No historical blocks to process');
      return currentBlock;
    }

    logger.info(`Processing historical events from block ${fromBlock} to ${currentBlock}`);

    // Process in small (<= 1000) chunks to avoid RPC timeout issues
    const CHUNK_SIZE = 1000;
    let processedBlocks = 0;
    let highestBlockProcessed = fromBlock;

    // Initialize the lastProcessedBlockNumber to the fromBlock - 1
    initLastProcessedBlock(fromBlock - 1);

    for (let chunkStart = fromBlock; chunkStart < currentBlock; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, currentBlock);
      logger.info(
        `Processing blocks ${chunkStart} to ${chunkEnd} (${chunkEnd - chunkStart + 1} blocks)`,
      );

      try {
        // Use retry logic with exponential backoff for each query
        // Query ToolRegistered events
        const registeredEvents = await retryOperation(async () => {
          const registeredFilter = contract.filters.ToolRegistered();
          return await contract.queryFilter(registeredFilter, chunkStart, chunkEnd);
        });

        // Query ToolUpdated events
        const updatedEvents = await retryOperation(async () => {
          const updatedFilter = contract.filters.ToolUpdated();
          return await contract.queryFilter(updatedFilter, chunkStart, chunkEnd);
        });

        // Query OwnershipTransferred events
        const transferEvents = await retryOperation(async () => {
          const transferFilter = contract.filters.OwnershipTransferred();
          return await contract.queryFilter(transferFilter, chunkStart, chunkEnd);
        });

        logger.info(
          `Found ${registeredEvents.length} ToolRegistered, ${updatedEvents.length} ToolUpdated, and ${transferEvents.length} OwnershipTransferred events`,
        );

        // Process all ToolRegistered events
        for (const event of registeredEvents) {
          try {
            if (!('args' in event)) {
              logger.warn('Skipping event without args property');
              continue;
            }

            if (!event.transactionHash) {
              logger.error(`Event missing transaction hash in block ${event.blockNumber}`);
              continue;
            }

            // Extract name from transaction - will throw error if not found
            let name;
            try {
              name = await extractNameFromTransaction(event.transactionHash, contract);
            } catch (error) {
              logger.error(
                `Failed to extract name for ToolRegistered event at block ${event.blockNumber}, tx ${event.transactionHash}:`,
                error,
              );
              continue;
            }

            const major = event.args[1];
            const minor = event.args[2];
            const patch = event.args[3];
            const cidHash = event.args[4];
            const publisher = event.args[5];
            const timestamp = event.args[6];

            // Extract metadataHash from transaction - will throw error if not found
            let metadataHash;
            try {
              metadataHash = await extractMetadataHashFromTransaction(
                event.transactionHash,
                contract,
              );
            } catch (error) {
              logger.error(
                `Failed to extract metadataHash for ToolRegistered event at block ${event.blockNumber}, tx ${event.transactionHash}:`,
                error,
              );
              continue;
            }

            const registeredEvent = {
              name,
              major: Number(major),
              minor: Number(minor),
              patch: Number(patch),
              cidHash,
              metadataHash,
              publisher,
              timestamp: new Date(Number(timestamp) * 1000),
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            };

            logger.info(`ToolRegistered event detected: ${name} v${major}.${minor}.${patch}`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash,
            });

            await callbacks.onToolRegistered(registeredEvent);
          } catch (error) {
            logger.error('Error processing historical ToolRegistered event:', error);
          }
        }

        // Process all ToolUpdated events
        for (const event of updatedEvents) {
          try {
            if (!('args' in event)) {
              logger.warn('Skipping event without args property');
              continue;
            }

            if (!event.transactionHash) {
              logger.error(`Event missing transaction hash in block ${event.blockNumber}`);
              continue;
            }

            // Extract name from transaction - will throw error if not found
            let name;
            try {
              name = await extractNameFromTransaction(event.transactionHash, contract);
            } catch (error) {
              logger.error(
                `Failed to extract name for ToolUpdated event at block ${event.blockNumber}, tx ${event.transactionHash}:`,
                error,
              );
              continue;
            }

            const major = event.args[1];
            const minor = event.args[2];
            const patch = event.args[3];
            const cidHash = event.args[4];
            const publisher = event.args[5];
            const timestamp = event.args[6];

            // Extract metadataHash from transaction - will throw error if not found
            let metadataHash;
            try {
              metadataHash = await extractMetadataHashFromTransaction(
                event.transactionHash,
                contract,
              );
            } catch (error) {
              logger.error(
                `Failed to extract metadataHash for ToolUpdated event at block ${event.blockNumber}, tx ${event.transactionHash}:`,
                error,
              );
              continue;
            }

            const updatedEvent = {
              name,
              major: Number(major),
              minor: Number(minor),
              patch: Number(patch),
              cidHash,
              metadataHash,
              publisher,
              timestamp: new Date(Number(timestamp) * 1000),
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            };

            logger.info(`ToolUpdated event detected: ${name} v${major}.${minor}.${patch}`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash,
            });

            await callbacks.onToolUpdated(updatedEvent);
          } catch (error) {
            logger.error('Error processing historical ToolUpdated event:', error);
          }
        }

        // Process all OwnershipTransferred events
        for (const event of transferEvents) {
          try {
            if (!('args' in event)) {
              logger.warn('Skipping event without args property');
              continue;
            }

            if (!event.transactionHash) {
              logger.error(`Event missing transaction hash in block ${event.blockNumber}`);
              continue;
            }

            // Extract name from transaction - will throw error if not found
            let name;
            try {
              name = await extractNameFromTransaction(event.transactionHash, contract);
            } catch (error) {
              logger.error(
                `Failed to extract name for OwnershipTransferred event at block ${event.blockNumber}, tx ${event.transactionHash}:`,
                error,
              );
              continue;
            }

            const previousOwner = event.args[1];
            const newOwner = event.args[2];

            const transferEvent = {
              name,
              previousOwner,
              newOwner,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            };

            logger.info(`OwnershipTransferred event detected: ${name}`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash,
              from: previousOwner,
              to: newOwner,
            });

            await callbacks.onOwnershipTransferred(transferEvent);
          } catch (error) {
            logger.error('Error processing historical OwnershipTransferred event:', error);
          }
        }

        // Update highest block processed
        highestBlockProcessed = chunkEnd;
        processedBlocks += chunkEnd - chunkStart + 1;

        // Update progress
        logger.info(
          `Processed ${processedBlocks} blocks so far. Now at block ${highestBlockProcessed}`,
        );
        await callbacks.onProcessedBlock(highestBlockProcessed);

        // Verify block continuity at the end of each chunk
        await verifyBlockContinuity(highestBlockProcessed, contract, callbacks, processBlock);
      } catch (error) {
        logger.error('Error processing historical events:', error);
        throw error;
      }
    }

    logger.info(`Historical event processing complete. Processed ${processedBlocks} blocks.`);
    return highestBlockProcessed;
  } catch (error) {
    logger.error('Error processing historical events:', error);
    throw error;
  }
};
