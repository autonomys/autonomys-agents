import { createLogger } from '../utils/logger.js';
import { 
  ToolRegisteredEvent, 
  ToolUpdatedEvent, 
  OwnershipTransferredEvent,
  parseVersion 
} from '../blockchain/contractService.js';
import {
  saveTool,
  getToolByNameHash,
  saveToolVersion,
  updateToolOwner,
  updateToolVersionMetadata,
  updateLastProcessedBlock
} from '../db/repositories/toolRepository.js';
import { ethers } from 'ethers';
import { hashToCid } from '../models/Tool.js';

const logger = createLogger('event-handlers');

/**
 * Handler for ToolRegistered events
 * Saves new tools and their initial versions to the database
 */
export const handleToolRegistered = async (event: ToolRegisteredEvent): Promise<void> => {
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
    
    // Convert hashes to CIDs
    const cid = hashToCid(event.cidHash);
    const metadataCid = hashToCid(event.metadataHash); // Use metadata hash for metadataCid
    
    // Save the tool version
    const version = parseVersion(event.major, event.minor, event.patch);
    await saveToolVersion(
      toolId,
      version,
      cid,
      metadataCid,
      event.publisher,
      event.timestamp
    );
    
    logger.info(`Tool version ${event.major}.${event.minor}.${event.patch} saved for ${event.name}`);
  } catch (error) {
    logger.error('Error handling ToolRegistered event:', error);
    throw error;
  }
};

/**
 * Handler for ToolUpdated events
 * Updates existing tool versions or adds new ones
 */
export const handleToolUpdated = async (event: ToolUpdatedEvent): Promise<void> => {
  logger.info(`Processing ToolUpdated: ${event.name} v${event.major}.${event.minor}.${event.patch}`);
  
  try {
    // Get the name hash
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(event.name));
    
    // Get the tool
    const tool = await getToolByNameHash(nameHash);
    
    // Convert hashes to CIDs
    const cid = hashToCid(event.cidHash);
    const metadataCid = hashToCid(event.metadataHash); // Use metadata hash for metadataCid
    
    if (!tool) {
      // This shouldn't happen - we should have received a ToolRegistered event first
      logger.warn(`Tool ${event.name} not found, creating it now`);
      const newTool = await saveTool(event.name, nameHash, event.publisher);
      
      // Save the version
      const version = parseVersion(event.major, event.minor, event.patch);
      await saveToolVersion(
        newTool.id,
        version,
        cid,
        metadataCid,
        event.publisher,
        event.timestamp
      );
    } else {
      // Check if this is a metadata update or a new version
      const version = parseVersion(event.major, event.minor, event.patch);
      
      // Try to update the metadata first
      const updated = await updateToolVersionMetadata(tool.id, version, metadataCid);
      
      if (!updated) {
        // If update failed, it means this is a new version
        await saveToolVersion(
          tool.id,
          version,
          cid,
          metadataCid,
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

/**
 * Handler for OwnershipTransferred events
 * Updates tool ownership in the database
 */
export const handleOwnershipTransferred = async (event: OwnershipTransferredEvent): Promise<void> => {
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

/**
 * Handler for processed block events
 * Updates the last processed block in the database
 */
export const handleProcessedBlock = async (blockNumber: number): Promise<void> => {
  try {
    await updateLastProcessedBlock(blockNumber);
  } catch (error) {
    logger.error('Error updating last processed block:', error);
  }
}; 