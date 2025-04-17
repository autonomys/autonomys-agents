import { createLogger } from './utils/logger.js';
import { config } from './config/index.js';
import { 
  initContract, 
  setupEventListeners, 
  processHistoricalEvents,
  ToolRegisteredEvent, 
  ToolUpdatedEvent, 
  OwnershipTransferredEvent,
  parseVersion
} from './blockchain/contractService.js';
import {
  saveTool,
  getToolByNameHash,
  saveToolVersion,
  updateToolOwner,
  updateToolVersionMetadata,
  getLastProcessedBlock,
  updateLastProcessedBlock
} from './db/repositories/toolRepository.js';
import { ethers } from 'ethers';
import { startServer } from './api/server.js';

const logger = createLogger('indexer-service');

// Handler for ToolRegistered events
const handleToolRegistered = async (event: ToolRegisteredEvent): Promise<void> => {
  logger.info(`Processing ToolRegistered: ${event.name} v${event.major}.${event.minor}.${event.patch}`);
  
  try {
    // Get the name hash
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(event.name));
    
    // Check if tool already exists
    const existingTool = await getToolByNameHash(nameHash);
    
    let toolId: number;
    
    if (existingTool) {
      logger.info(`Tool ${event.name} already exists, using existing record`);
      toolId = existingTool.id;
    } else {
      // Save the new tool
      const tool = await saveTool(event.name, nameHash, event.publisher);
      logger.info(`New tool ${event.name} saved with ID ${tool.id}`);
      toolId = tool.id;
    }
    
    // Save the tool version
    const version = parseVersion(event.major, event.minor, event.patch);
    await saveToolVersion(
      toolId,
      version,
      event.cidHash,
      event.cidHash, // Initially metadata hash is the same as cid hash
      event.publisher,
      event.timestamp
    );
    
    logger.info(`Tool version ${event.major}.${event.minor}.${event.patch} saved for ${event.name}`);
  } catch (error) {
    logger.error('Error handling ToolRegistered event:', error);
    throw error;
  }
};

// Handler for ToolUpdated events
const handleToolUpdated = async (event: ToolUpdatedEvent): Promise<void> => {
  logger.info(`Processing ToolUpdated: ${event.name} v${event.major}.${event.minor}.${event.patch}`);
  
  try {
    // Get the name hash
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(event.name));
    
    // Get the tool
    const tool = await getToolByNameHash(nameHash);
    
    if (!tool) {
      // This shouldn't happen - we should have received a ToolRegistered event first
      logger.warn(`Tool ${event.name} not found, creating it now`);
      const newTool = await saveTool(event.name, nameHash, event.publisher);
      
      // Save the version
      const version = parseVersion(event.major, event.minor, event.patch);
      await saveToolVersion(
        newTool.id,
        version,
        event.cidHash,
        event.cidHash, // Initially metadata hash is the same as cid hash  
        event.publisher,
        event.timestamp
      );
    } else {
      // Check if this is a metadata update or a new version
      const version = parseVersion(event.major, event.minor, event.patch);
      
      // Try to update the metadata first
      const updated = await updateToolVersionMetadata(tool.id, version, event.cidHash);
      
      if (!updated) {
        // If update failed, it means this is a new version
        await saveToolVersion(
          tool.id,
          version,
          event.cidHash,
          event.cidHash, // Initially metadata hash is the same as cid hash
          event.publisher,
          event.timestamp
        );
        logger.info(`New tool version ${event.major}.${event.minor}.${event.patch} saved for ${event.name}`);
      } else {
        logger.info(`Updated metadata for ${event.name} v${event.major}.${event.minor}.${event.patch}`);
      }
    }
  } catch (error) {
    logger.error('Error handling ToolUpdated event:', error);
    throw error;
  }
};

// Handler for OwnershipTransferred events
const handleOwnershipTransferred = async (event: OwnershipTransferredEvent): Promise<void> => {
  logger.info(`Processing OwnershipTransferred: ${event.name} from ${event.previousOwner} to ${event.newOwner}`);
  
  try {
    // Get the name hash
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(event.name));
    
    // Update the tool owner
    const updated = await updateToolOwner(nameHash, event.newOwner);
    
    if (updated) {
      logger.info(`Ownership of ${event.name} transferred to ${event.newOwner}`);
    } else {
      logger.warn(`Tool ${event.name} not found for ownership transfer`);
    }
  } catch (error) {
    logger.error('Error handling OwnershipTransferred event:', error);
    throw error;
  }
};

// Handler for block processed events
const handleProcessedBlock = async (blockNumber: number): Promise<void> => {
  try {
    await updateLastProcessedBlock(blockNumber);
  } catch (error) {
    logger.error('Error updating last processed block:', error);
  }
};

// Start the indexer
const startIndexer = async (): Promise<void> => {
  try {
    logger.info('Starting AutonomysPackageRegistry indexer');
    
    // Get the last processed block
    const lastProcessedBlock = await getLastProcessedBlock();
    const startBlock = Math.max(lastProcessedBlock, config.START_BLOCK);
    
    logger.info(`Starting from block ${startBlock}`);
    
    // Initialize contract connection
    const { contract } = initContract();

    // Create the event callbacks
    const eventCallbacks = {
      onToolRegistered: handleToolRegistered,
      onToolUpdated: handleToolUpdated,
      onOwnershipTransferred: handleOwnershipTransferred,
      onProcessedBlock: handleProcessedBlock
    };
    
    // Start the API server (with configurable port)
    const apiPort = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;
    const { shutdown: shutdownApi } = startServer(apiPort);
    
    // First process historical events
    logger.info('Processing historical events...');
    const lastProcessedHistoricalBlock = await processHistoricalEvents(
      contract,
      startBlock,
      eventCallbacks
    );
    
    // Then setup event listeners for new events
    logger.info(`Historical processing complete. Now listening for new events from block ${lastProcessedHistoricalBlock + 1}`);
    const cleanupListeners = setupEventListeners(
      contract,
      lastProcessedHistoricalBlock + 1,
      eventCallbacks
    );
    
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