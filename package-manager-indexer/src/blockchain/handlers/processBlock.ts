import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { EventCallbacks } from '../types/events.js';
import {
  extractNameFromTransaction,
  extractMetadataHashFromTransaction,
} from '../utils/transactionUtils.js';
import { retryOperation } from '../utils/retryUtils.js';

const logger = createLogger('process-block');

/**
 * Process a single block and all its events
 * @param blockNumber Block number to process
 * @param contract Contract instance
 * @param callbacks Event callbacks
 */
export const processBlock = async (
  blockNumber: number,
  contract: ethers.Contract,
  callbacks: EventCallbacks,
): Promise<void> => {
  logger.info(`Processing single block ${blockNumber}`);

  try {
    // Query all relevant events for this block
    logger.debug(`Querying events for block ${blockNumber}`);
    const registeredFilter = contract.filters.ToolRegistered();
    const updatedFilter = contract.filters.ToolUpdated();
    const transferFilter = contract.filters.OwnershipTransferred();

    // Use retryOperation for each query to make it more resilient
    const [registeredEvents, updatedEvents, transferEvents] = await Promise.all([
      retryOperation(() => contract.queryFilter(registeredFilter, blockNumber, blockNumber)),
      retryOperation(() => contract.queryFilter(updatedFilter, blockNumber, blockNumber)),
      retryOperation(() => contract.queryFilter(transferFilter, blockNumber, blockNumber)),
    ]);

    logger.info(
      `Found ${registeredEvents.length} ToolRegistered, ${updatedEvents.length} ToolUpdated, and ${transferEvents.length} OwnershipTransferred events in block ${blockNumber}`,
    );

    // Process all ToolRegistered events
    if (registeredEvents.length > 0) {
      logger.debug(
        `Processing ${registeredEvents.length} ToolRegistered events in block ${blockNumber}`,
      );
    }

    for (let i = 0; i < registeredEvents.length; i++) {
      const event = registeredEvents[i];
      logger.debug(
        `Processing ToolRegistered event ${i + 1}/${registeredEvents.length} in block ${blockNumber}`,
      );

      try {
        if (!('args' in event)) {
          logger.warn('Skipping event without args property');
          continue;
        }

        if (!event.transactionHash) {
          logger.error(`Event missing transaction hash in block ${blockNumber}`);
          continue;
        }

        logger.debug(`Extracting tool name from tx ${event.transactionHash}`);
        // Extract tool name from transaction - will throw error if not found
        const name = await extractNameFromTransaction(event.transactionHash, contract);

        const major = event.args[1];
        const minor = event.args[2];
        const patch = event.args[3];
        const cidHash = event.args[4];
        const publisher = event.args[5];
        const timestamp = event.args[6];

        logger.debug(`Extracting metadata hash from tx ${event.transactionHash}`);
        // Extract metadataHash from transaction - will throw error if not found
        const metadataHash = await extractMetadataHashFromTransaction(
          event.transactionHash,
          contract,
        );

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

        logger.info(
          `ToolRegistered event detected in block ${blockNumber}: ${name} v${major}.${minor}.${patch}`,
          {
            blockNumber: event.blockNumber,
            txHash: event.transactionHash,
          },
        );

        logger.debug(`Calling onToolRegistered callback for ${name}`);
        await callbacks.onToolRegistered(registeredEvent);
        logger.debug(`Finished processing ToolRegistered event for ${name}`);
      } catch (error) {
        logger.error(`Error processing ToolRegistered event in block ${blockNumber}:`, error);
      }
    }

    // Process all ToolUpdated events
    if (updatedEvents.length > 0) {
      logger.debug(`Processing ${updatedEvents.length} ToolUpdated events in block ${blockNumber}`);
    }

    for (let i = 0; i < updatedEvents.length; i++) {
      const event = updatedEvents[i];
      logger.debug(
        `Processing ToolUpdated event ${i + 1}/${updatedEvents.length} in block ${blockNumber}`,
      );

      try {
        if (!('args' in event)) {
          logger.warn('Skipping event without args property');
          continue;
        }

        if (!event.transactionHash) {
          logger.error(`Event missing transaction hash in block ${blockNumber}`);
          continue;
        }

        logger.debug(`Extracting tool name from tx ${event.transactionHash}`);
        // Extract tool name from transaction - will throw error if not found
        const name = await extractNameFromTransaction(event.transactionHash, contract);

        const major = event.args[1];
        const minor = event.args[2];
        const patch = event.args[3];
        const cidHash = event.args[4];
        const publisher = event.args[5];
        const timestamp = event.args[6];

        logger.debug(`Extracting metadata hash from tx ${event.transactionHash}`);
        // Extract metadataHash from transaction - will throw error if not found
        const metadataHash = await extractMetadataHashFromTransaction(
          event.transactionHash,
          contract,
        );

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

        logger.info(
          `ToolUpdated event detected in block ${blockNumber}: ${name} v${major}.${minor}.${patch}`,
          {
            blockNumber: event.blockNumber,
            txHash: event.transactionHash,
          },
        );

        logger.debug(`Calling onToolUpdated callback for ${name}`);
        await callbacks.onToolUpdated(updatedEvent);
        logger.debug(`Finished processing ToolUpdated event for ${name}`);
      } catch (error) {
        logger.error(`Error processing ToolUpdated event in block ${blockNumber}:`, error);
      }
    }

    // Process all OwnershipTransferred events
    if (transferEvents.length > 0) {
      logger.debug(
        `Processing ${transferEvents.length} OwnershipTransferred events in block ${blockNumber}`,
      );
    }

    for (let i = 0; i < transferEvents.length; i++) {
      const event = transferEvents[i];
      logger.debug(
        `Processing OwnershipTransferred event ${i + 1}/${transferEvents.length} in block ${blockNumber}`,
      );

      try {
        if (!('args' in event)) {
          logger.warn('Skipping event without args property');
          continue;
        }

        if (!event.transactionHash) {
          logger.error(`Event missing transaction hash in block ${blockNumber}`);
          continue;
        }

        logger.debug(`Extracting tool name from tx ${event.transactionHash}`);
        // Extract tool name from transaction - will throw error if not found
        const name = await extractNameFromTransaction(event.transactionHash, contract);

        const previousOwner = event.args[1];
        const newOwner = event.args[2];

        const transferEvent = {
          name,
          previousOwner,
          newOwner,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        };

        logger.info(`OwnershipTransferred event detected in block ${blockNumber}: ${name}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          from: previousOwner,
          to: newOwner,
        });

        logger.debug(`Calling onOwnershipTransferred callback for ${name}`);
        await callbacks.onOwnershipTransferred(transferEvent);
        logger.debug(`Finished processing OwnershipTransferred event for ${name}`);
      } catch (error) {
        logger.error(`Error processing OwnershipTransferred event in block ${blockNumber}:`, error);
      }
    }

    // Mark block as processed
    logger.debug(`Marking block ${blockNumber} as processed`);
    await callbacks.onProcessedBlock(blockNumber);
    logger.debug(`Successfully processed block ${blockNumber}`);
  } catch (error) {
    logger.error(`Error processing block ${blockNumber}:`, error);
    throw error;
  }
};
