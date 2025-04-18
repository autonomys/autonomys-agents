import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { EventCallbacks } from '../types/events.js';
import { verifyBlockContinuity } from '../utils/blockUtils.js';
import { extractNameFromTransaction, extractMetadataHashFromTransaction, extractToolName } from '../utils/transactionUtils.js';
import { processBlock } from './processBlock.js';

const logger = createLogger('event-listeners');

/**
 * Setup WebSocket event listeners for the contract
 * @param contract Contract instance
 * @param fromBlock Starting block number
 * @param callbacks Event callbacks
 * @returns A cleanup function to remove all listeners
 */
export const setupEventListeners = (
  contract: ethers.Contract,
  fromBlock: number,
  callbacks: EventCallbacks
): (() => void) => {
  logger.info(`Setting up event listeners from block ${fromBlock}`);

  // Print current block
  const provider = contract.runner as ethers.WebSocketProvider;
  provider.getBlockNumber().then((currentBlock: number) => {
    logger.info(`Current blockchain height is block ${currentBlock}`);
    if (fromBlock < currentBlock) {
      logger.info(`Indexer needs to process ${currentBlock - fromBlock} blocks to catch up`);
    }
  });

  // Setup filter for ToolRegistered events
  const toolRegisteredFilter = contract.filters.ToolRegistered();
  contract.on(toolRegisteredFilter, 
    async (rawName: any, major: ethers.BigNumberish, minor: ethers.BigNumberish, patch: ethers.BigNumberish, 
           cidHash: string, publisher: string, timestamp: ethers.BigNumberish, event: ethers.EventLog) => {
      try {
        if (event.blockNumber < fromBlock) {
          return;
        }
        
        // Try to extract the real name from transaction
        let name: string;
        if (event.transactionHash) {
          const extractedName = await extractNameFromTransaction(event.transactionHash, contract);
          name = extractedName || extractToolName(rawName);
        } else {
          name = extractToolName(rawName);
        }
        
        // Extract metadataHash from transaction
        let metadataHash = null;
        if (event.transactionHash) {
          metadataHash = await extractMetadataHashFromTransaction(event.transactionHash, contract);
        }
        
        if (!metadataHash) {
          logger.warn(`Could not extract metadataHash for ToolRegistered event at block ${event.blockNumber}, tx ${event.transactionHash}`);
          return; // Skip this event if we can't get the metadataHash
        }
        
        const registeredEvent = {
          name,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          cidHash,
          metadataHash,
          publisher,
          timestamp: new Date(Number(timestamp) * 1000), // Convert to milliseconds
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        
        logger.info(`ToolRegistered event detected: ${name} v${major}.${minor}.${patch}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
        
        await callbacks.onToolRegistered(registeredEvent);
        await callbacks.onProcessedBlock(event.blockNumber);
      } catch (error) {
        logger.error('Error processing ToolRegistered event:', error);
      }
    }
  );

  // Setup filter for ToolUpdated events
  const toolUpdatedFilter = contract.filters.ToolUpdated();
  contract.on(toolUpdatedFilter, 
    async (rawName: any, major: ethers.BigNumberish, minor: ethers.BigNumberish, patch: ethers.BigNumberish, 
           cidHash: string, publisher: string, timestamp: ethers.BigNumberish, event: ethers.EventLog) => {
      try {
        if (event.blockNumber < fromBlock) {
          return;
        }
        
        // Try to extract the real name from transaction
        let name: string;
        if (event.transactionHash) {
          const extractedName = await extractNameFromTransaction(event.transactionHash, contract);
          name = extractedName || extractToolName(rawName);
        } else {
          name = extractToolName(rawName);
        }
        
        // Extract metadataHash from transaction
        let metadataHash = null;
        if (event.transactionHash) {
          metadataHash = await extractMetadataHashFromTransaction(event.transactionHash, contract);
        }
        
        if (!metadataHash) {
          logger.warn(`Could not extract metadataHash for ToolUpdated event at block ${event.blockNumber}, tx ${event.transactionHash}`);
          return; // Skip this event if we can't get the metadataHash
        }
        
        const updatedEvent = {
          name,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          cidHash,
          metadataHash,
          publisher,
          timestamp: new Date(Number(timestamp) * 1000), // Convert to milliseconds
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        
        logger.info(`ToolUpdated event detected: ${name} v${major}.${minor}.${patch}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
        
        await callbacks.onToolUpdated(updatedEvent);
        await callbacks.onProcessedBlock(event.blockNumber);
      } catch (error) {
        logger.error('Error processing ToolUpdated event:', error);
      }
    }
  );

  // Setup filter for OwnershipTransferred events
  const ownershipTransferredFilter = contract.filters.OwnershipTransferred();
  contract.on(ownershipTransferredFilter, 
    async (rawName: any, previousOwner: string, newOwner: string, event: ethers.EventLog) => {
      try {
        if (event.blockNumber < fromBlock) {
          return;
        }
        
        // Try to extract the real name from transaction
        let name: string;
        if (event.transactionHash) {
          const extractedName = await extractNameFromTransaction(event.transactionHash, contract);
          name = extractedName || extractToolName(rawName);
        } else {
          name = extractToolName(rawName);
        }
        
        const transferEvent = {
          name,
          previousOwner,
          newOwner,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        
        logger.info(`OwnershipTransferred event detected: ${name}`, {
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          from: previousOwner,
          to: newOwner
        });
        
        await callbacks.onOwnershipTransferred(transferEvent);
        await callbacks.onProcessedBlock(event.blockNumber);
      } catch (error) {
        logger.error('Error processing OwnershipTransferred event:', error);
      }
    }
  );

  // Also setup a block listener to track progress even when no events occur
  provider.on('block', async (blockNumber: number) => {
    try {
      // Always log blocks in debug mode
      logger.debug(`New block: ${blockNumber}`);
      
      // Verify block continuity for real-time blocks
      await verifyBlockContinuity(blockNumber, contract, callbacks, processBlock);
      
      // Every 10 blocks, log current progress
      if (blockNumber % 10 === 0) {
        logger.info(`Processing block ${blockNumber}`);
        await callbacks.onProcessedBlock(blockNumber);
      }
      
      // Every 100 blocks, log a progress summary
      if (blockNumber % 100 === 0) {
        logger.info(`Indexer progress: processed up to block ${blockNumber}`);
      }
    } catch (error) {
      logger.error('Error processing block:', error);
    }
  });

  logger.info('Event listeners setup complete');

  // Return the cleanup function
  return () => {
    logger.info('Removing event listeners');
    contract.removeAllListeners();
    provider.removeAllListeners();
  };
}; 