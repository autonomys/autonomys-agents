import { ethers } from 'ethers';
import AutonomysPackageRegistryABI from './abi/AutonomysPackageRegistry.abi.json' with { type: 'json' };
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { Version } from '../models/Tool.js';

const logger = createLogger('contract-service');

// Add a helper function for retrying operations with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000, // 1 second
  factor: number = 2 // Exponential factor
): Promise<T> {
  let currentTry = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      currentTry++;
      if (currentTry >= maxRetries) {
        logger.error(`Operation failed after ${maxRetries} retries:`, error);
        throw error;
      }
      
      logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${currentTry}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= factor; // Exponential backoff
    }
  }
}

// Contract event types
export interface ToolRegisteredEvent {
  name: string;
  major: number;
  minor: number;
  patch: number;
  cidHash: string;
  publisher: string;
  timestamp: Date;
  blockNumber: number;
  transactionHash: string;
}

export interface ToolUpdatedEvent {
  name: string;
  major: number;
  minor: number;
  patch: number;
  cidHash: string;
  publisher: string;
  timestamp: Date;
  blockNumber: number;
  transactionHash: string;
}

export interface OwnershipTransferredEvent {
  name: string;
  previousOwner: string;
  newOwner: string;
  blockNumber: number;
  transactionHash: string;
}

// Initialize the contract instance
export const initContract = () => {
  try {
    logger.info('Initializing contract connection');
    
    const provider = new ethers.WebSocketProvider(config.RPC_URL);
    const contract = new ethers.Contract(
      config.CONTRACT_ADDRESS,
      AutonomysPackageRegistryABI,
      provider
    );
    
    logger.info('Contract connection initialized successfully');
    
    return { provider, contract };
  } catch (error) {
    logger.error('Failed to initialize contract connection:', error);
    throw error;
  }
};

// Process historical events in batches
export const processHistoricalEvents = async (
  contract: ethers.Contract,
  fromBlock: number,
  callbacks: {
    onToolRegistered: (event: ToolRegisteredEvent) => Promise<void>;
    onToolUpdated: (event: ToolUpdatedEvent) => Promise<void>;
    onOwnershipTransferred: (event: OwnershipTransferredEvent) => Promise<void>;
    onProcessedBlock: (blockNumber: number) => Promise<void>;
  }
) => {
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
    
    // Process in smaller chunks to avoid RPC timeout issues
    const CHUNK_SIZE = 1000; // Reduced from 10000 to avoid timeouts
    let processedBlocks = 0;
    let highestBlockProcessed = fromBlock;
    
    for (let chunkStart = fromBlock; chunkStart < currentBlock; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, currentBlock);
      logger.info(`Processing blocks ${chunkStart} to ${chunkEnd} (${chunkEnd - chunkStart + 1} blocks)`);
      
      try {
        // Use retry logic with exponential backoff for each query
        // Query ToolRegistered events
        const registeredEvents = await retryOperation(
          async () => {
            const registeredFilter = contract.filters.ToolRegistered();
            return await contract.queryFilter(registeredFilter, chunkStart, chunkEnd);
          }
        );
        
        // Query ToolUpdated events
        const updatedEvents = await retryOperation(
          async () => {
            const updatedFilter = contract.filters.ToolUpdated();
            return await contract.queryFilter(updatedFilter, chunkStart, chunkEnd);
          }
        );
        
        // Query OwnershipTransferred events
        const transferEvents = await retryOperation(
          async () => {
            const transferFilter = contract.filters.OwnershipTransferred();
            return await contract.queryFilter(transferFilter, chunkStart, chunkEnd);
          }
        );
        
        logger.info(`Found ${registeredEvents.length} ToolRegistered, ${updatedEvents.length} ToolUpdated, and ${transferEvents.length} OwnershipTransferred events`);
        
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
            
            const registeredEvent: ToolRegisteredEvent = {
              name,
              major: Number(major),
              minor: Number(minor),
              patch: Number(patch),
              cidHash,
              publisher,
              timestamp: new Date(Number(timestamp) * 1000),
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash || ''
            };
            
            logger.info(`ToolRegistered event detected: ${name} v${major}.${minor}.${patch}`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash
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
            
            const updatedEvent: ToolUpdatedEvent = {
              name,
              major: Number(major),
              minor: Number(minor),
              patch: Number(patch),
              cidHash,
              publisher,
              timestamp: new Date(Number(timestamp) * 1000),
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash || ''
            };
            
            logger.info(`ToolUpdated event detected: ${name} v${major}.${minor}.${patch}`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash
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
            
            const transferEvent: OwnershipTransferredEvent = {
              name,
              previousOwner,
              newOwner,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash || ''
            };
            
            logger.info(`OwnershipTransferred event detected: ${name}`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash,
              from: previousOwner,
              to: newOwner
            });
            
            await callbacks.onOwnershipTransferred(transferEvent);
          } catch (error) {
            logger.error('Error processing historical OwnershipTransferred event:', error);
          }
        }
        
        // Update highest block processed
        highestBlockProcessed = chunkEnd;
        processedBlocks += (chunkEnd - chunkStart + 1);
        
        // Update progress
        logger.info(`Processed ${processedBlocks} blocks so far. Now at block ${highestBlockProcessed}`);
        await callbacks.onProcessedBlock(highestBlockProcessed);
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

// Setup event listeners for the contract
export const setupEventListeners = (
  contract: ethers.Contract,
  fromBlock: number,
  callbacks: {
    onToolRegistered: (event: ToolRegisteredEvent) => Promise<void>;
    onToolUpdated: (event: ToolUpdatedEvent) => Promise<void>;
    onOwnershipTransferred: (event: OwnershipTransferredEvent) => Promise<void>;
    onProcessedBlock: (blockNumber: number) => Promise<void>;
  }
) => {
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
        
        const registeredEvent: ToolRegisteredEvent = {
          name,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          cidHash,
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
        
        const updatedEvent: ToolUpdatedEvent = {
          name,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          cidHash,
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
        
        const transferEvent: OwnershipTransferredEvent = {
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
  // Get the provider from the contract and cast it to the correct type
  provider.on('block', async (blockNumber: number) => {
    try {
      // Always log blocks in debug mode
      logger.debug(`New block: ${blockNumber}`);
      
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
    // Get the provider from the contract and cast it to the correct type
    provider.removeAllListeners();
  };
};

// Helper function to parse version from event data
export const parseVersion = (major: number, minor: number, patch: number): Version => {
  return {
    major,
    minor,
    patch
  };
};

// Helper function to extract the original tool name from transaction data
async function extractNameFromTransaction(
  txHash: string,
  contract: ethers.Contract
): Promise<string | null> {
  try {
    logger.debug(`Fetching transaction ${txHash} to extract original tool name`);
    const provider = contract.runner as ethers.Provider;
    const tx = await provider.getTransaction(txHash);
    
    if (!tx || !tx.data) {
      logger.warn(`Transaction ${txHash} data not available`);
      return null;
    }
    
    // Try to decode the transaction input
    try {
      const iface = new ethers.Interface(contract.interface.fragments);
      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      
      if (!decoded) {
        logger.warn(`Could not decode transaction ${txHash}`);
        return null;
      }
      
      // Check if this is a registerTool call (or other relevant function)
      if (decoded.name === 'registerTool' && decoded.args.length > 0) {
        // The first argument should be the name
        const name = decoded.args[0];
        if (typeof name === 'string') {
          logger.info(`Successfully extracted tool name "${name}" from transaction`);
          return name;
        }
      }
      
      // Check for other functions that include the tool name
      if ((decoded.name === 'updateToolMetadata' || decoded.name === 'transferToolOwnership') && 
          decoded.args.length > 0) {
        // The first argument in these functions is also the name
        const name = decoded.args[0];
        if (typeof name === 'string') {
          logger.info(`Successfully extracted tool name "${name}" from ${decoded.name} transaction`);
          return name;
        }
      }
      
      logger.debug(`Transaction ${txHash} function or name not found`);
      return null;
    } catch (error) {
      logger.warn(`Error decoding transaction ${txHash}:`, error);
      return null;
    }
  } catch (error) {
    logger.error(`Error fetching transaction ${txHash}:`, error);
    return null;
  }
}

// A helper to extract meaningful identifiers from indexed parameters
function extractToolName(value: any): string {
  // If it's a plain string, just return it
  if (typeof value === 'string') {
    return value;
  }
  
  // If it's an indexed parameter
  if (value && typeof value === 'object' && '_isIndexed' in value && value.hash) {
    // Create a readable identifier from the hash
    return `tool-${value.hash.substring(2, 10)}`;
  }
  
  // Fallback
  return String(value);
}