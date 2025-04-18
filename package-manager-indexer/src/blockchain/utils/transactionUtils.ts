import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('transaction-utils');

/**
 * Extracts the original tool name from transaction data
 * @param txHash Transaction hash
 * @param contract Contract instance
 * @returns Extracted name or null
 */
export const extractNameFromTransaction = async (
  txHash: string,
  contract: ethers.Contract
): Promise<string | null> => {
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
};

/**
 * Extracts a meaningful identifier from indexed parameters
 * @param value The value to extract from
 * @returns The extracted tool name
 */
export const extractToolName = (value: any): string => {
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
};

/**
 * Extracts the metadata hash from transaction data
 * @param txHash Transaction hash
 * @param contract Contract instance
 * @returns Extracted metadata hash or null
 */
export const extractMetadataHashFromTransaction = async (
  txHash: string,
  contract: ethers.Contract
): Promise<string | null> => {
  try {
    logger.debug(`Fetching transaction ${txHash} to extract metadata hash`);
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
      
      // Check if this is a registerTool call which includes a metadataHash
      if (decoded.name === 'registerTool' && decoded.args.length >= 4) {
        // The 4th argument should be the metadataHash
        const metadataHash = decoded.args[3];
        if (metadataHash && typeof metadataHash === 'string') {
          logger.info(`Successfully extracted metadataHash "${metadataHash}" from registerTool transaction`);
          return metadataHash;
        }
      }
      
      // Check for updateToolMetadata call which includes a metadataHash
      if (decoded.name === 'updateToolMetadata' && decoded.args.length >= 4) {
        // The 4th argument is the metadataHash
        const metadataHash = decoded.args[3];
        if (metadataHash && typeof metadataHash === 'string') {
          logger.info(`Successfully extracted metadataHash "${metadataHash}" from updateToolMetadata transaction`);
          return metadataHash;
        }
      }
      
      logger.debug(`No metadataHash found in transaction ${txHash}`);
      return null;
    } catch (error) {
      logger.warn(`Error decoding transaction ${txHash}:`, error);
      return null;
    }
  } catch (error) {
    logger.error(`Error fetching transaction ${txHash}:`, error);
    return null;
  }
}; 