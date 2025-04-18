import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { EventCallbacks } from '../types/events.js';
import { extractNameFromTransaction, extractMetadataHashFromTransaction, extractToolName } from '../utils/transactionUtils.js';

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
  callbacks: EventCallbacks
): Promise<void> => {
  logger.info(`Processing single block ${blockNumber}`);
  
  try {
    // Query all relevant events for this block
    const registeredFilter = contract.filters.ToolRegistered();
    const updatedFilter = contract.filters.ToolUpdated();
    const transferFilter = contract.filters.OwnershipTransferred();
    
    const [registeredEvents, updatedEvents, transferEvents] = await Promise.all([
      contract.queryFilter(registeredFilter, blockNumber, blockNumber),
      contract.queryFilter(updatedFilter, blockNumber, blockNumber),
      contract.queryFilter(transferFilter, blockNumber, blockNumber)
    ]);
    
    logger.info(`Found ${registeredEvents.length} ToolRegistered, ${updatedEvents.length} ToolUpdated, and ${transferEvents.length} OwnershipTransferred events in block ${blockNumber}`);
    
    // Process all ToolRegistered events
    for (const event of registeredEvents) {
      try {
        if (!('args' in event)) {
          logger.warn('Skipping event without args property');
          continue;
        }
        
        const rawName = event.args[0];
        // First try to get the real name from the transaction
        let name: string;
        if (event.transactionHash) {
          const extractedName = await extractNameFromTransaction(event.transactionHash, contract);
          name = extractedName || extractToolName(rawName);
        } else {
          name = extractToolName(rawName);
        }
        
        const major = event.args[1];
        const minor = event.args[2];
        const patch = event.args[3];
        const cidHash = event.args[4];
        const publisher = event.args[5];
        const timestamp = event.args[6];
        
        // Extract metadataHash from transaction
        let metadataHash = null;
        if (event.transactionHash) {
          metadataHash = await extractMetadataHashFromTransaction(event.transactionHash, contract);
        }
        
        if (!metadataHash) {
          logger.warn(`Could not extract metadataHash for ToolRegistered event at block ${event.blockNumber}, tx ${event.transactionHash}`);
          continue; // Skip this event if we can't get the metadataHash
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
          transactionHash: event.transactionHash || ''
        };
        
        logger.info(`ToolRegistered event detected in block ${blockNumber}: ${name} v${major}.${minor}.${patch}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
        
        await callbacks.onToolRegistered(registeredEvent);
      } catch (error) {
        logger.error(`Error processing ToolRegistered event in block ${blockNumber}:`, error);
      }
    }
    
    // Process all ToolUpdated events
    for (const event of updatedEvents) {
      try {
        if (!('args' in event)) {
          logger.warn('Skipping event without args property');
          continue;
        }
        
        const rawName = event.args[0];
        // Try to get the real name from the transaction
        let name: string;
        if (event.transactionHash) {
          const extractedName = await extractNameFromTransaction(event.transactionHash, contract);
          name = extractedName || extractToolName(rawName);
        } else {
          name = extractToolName(rawName);
        }
        
        const major = event.args[1];
        const minor = event.args[2];
        const patch = event.args[3];
        const cidHash = event.args[4];
        const publisher = event.args[5];
        const timestamp = event.args[6];
        
        // Extract metadataHash from transaction
        let metadataHash = null;
        if (event.transactionHash) {
          metadataHash = await extractMetadataHashFromTransaction(event.transactionHash, contract);
        }
        
        if (!metadataHash) {
          logger.warn(`Could not extract metadataHash for ToolUpdated event at block ${event.blockNumber}, tx ${event.transactionHash}`);
          continue; // Skip this event if we can't get the metadataHash
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
          transactionHash: event.transactionHash || ''
        };
        
        logger.info(`ToolUpdated event detected in block ${blockNumber}: ${name} v${major}.${minor}.${patch}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
        
        await callbacks.onToolUpdated(updatedEvent);
      } catch (error) {
        logger.error(`Error processing ToolUpdated event in block ${blockNumber}:`, error);
      }
    }
    
    // Process all OwnershipTransferred events
    for (const event of transferEvents) {
      try {
        if (!('args' in event)) {
          logger.warn('Skipping event without args property');
          continue;
        }
        
        const rawName = event.args[0];
        // Try to get the real name from the transaction
        let name: string;
        if (event.transactionHash) {
          const extractedName = await extractNameFromTransaction(event.transactionHash, contract);
          name = extractedName || extractToolName(rawName);
        } else {
          name = extractToolName(rawName);
        }
        
        const previousOwner = event.args[1];
        const newOwner = event.args[2];
        
        const transferEvent = {
          name,
          previousOwner,
          newOwner,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash || ''
        };
        
        logger.info(`OwnershipTransferred event detected in block ${blockNumber}: ${name}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          from: previousOwner,
          to: newOwner
        });
        
        await callbacks.onOwnershipTransferred(transferEvent);
      } catch (error) {
        logger.error(`Error processing OwnershipTransferred event in block ${blockNumber}:`, error);
      }
    }
    
    // Mark block as processed
    await callbacks.onProcessedBlock(blockNumber);
    
  } catch (error) {
    logger.error(`Error processing block ${blockNumber}:`, error);
    throw error;
  }
}; 