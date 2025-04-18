import { ethers } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { retryOperation } from './retryUtils.js';

const logger = createLogger('transaction-utils');

// Timeout for transaction fetching (30 seconds)
const TRANSACTION_FETCH_TIMEOUT = 30000;

/**
 * Promise with timeout wrapper
 * @param promise Original promise
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message on timeout
 * @returns Promise that will reject after timeout
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

/**
 * Extracts the original tool name from transaction data
 * According to the smart contract, the name is always available
 * in the transaction data for all relevant events
 * 
 * @param txHash Transaction hash
 * @param contract Contract instance
 * @returns Extracted name
 * @throws Error if the name cannot be extracted
 */
export const extractNameFromTransaction = async (
  txHash: string,
  contract: ethers.Contract
): Promise<string> => {
  return await retryOperation(async () => {
    try {
      logger.debug(`Fetching transaction ${txHash} to extract tool name`);
      const provider = contract.runner as ethers.Provider;
      
      // Fetch transaction with timeout
      const tx = await withTimeout(
        provider.getTransaction(txHash),
        TRANSACTION_FETCH_TIMEOUT,
        `Timeout fetching transaction ${txHash}`
      );
      
      if (!tx || !tx.data) {
        const errorMessage = `Transaction ${txHash} data not available`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      logger.debug(`Successfully fetched transaction ${txHash}, decoding data`);
      
      // Decode the transaction input
      const iface = new ethers.Interface(contract.interface.fragments);
      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      
      if (!decoded) {
        const errorMessage = `Could not decode transaction ${txHash}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      logger.debug(`Decoded transaction ${txHash}: function ${decoded.name}`);
      
      // Check if this is one of the functions that include the tool name
      if ((decoded.name === 'registerTool' || 
           decoded.name === 'updateToolMetadata' || 
           decoded.name === 'transferToolOwnership') && 
          decoded.args.length > 0) {
        // The first argument in these functions is always the name
        const name = decoded.args[0];
        if (typeof name === 'string' && name.trim() !== '') {
          logger.info(`Successfully extracted tool name "${name}" from ${decoded.name} transaction`);
          return name;
        }
      }
      
      // If we got here, we couldn't extract the name
      const errorMessage = `Could not find tool name in transaction ${txHash} (function: ${decoded.name})`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    } catch (error: any) {
      logger.error(`Error extracting name from transaction ${txHash}:`, error);
      throw new Error(`Failed to extract tool name from transaction ${txHash}: ${error.message}`);
    }
  }, 3, 1000, 2);
};

/**
 * Extracts the metadata hash from transaction data
 * @param txHash Transaction hash
 * @param contract Contract instance
 * @returns Extracted metadata hash
 * @throws Error if the metadata hash cannot be extracted
 */
export const extractMetadataHashFromTransaction = async (
  txHash: string,
  contract: ethers.Contract
): Promise<string> => {
  return await retryOperation(async () => {
    try {
      logger.debug(`Fetching transaction ${txHash} to extract metadata hash`);
      const provider = contract.runner as ethers.Provider;
      
      // Fetch transaction with timeout
      const tx = await withTimeout(
        provider.getTransaction(txHash),
        TRANSACTION_FETCH_TIMEOUT,
        `Timeout fetching transaction ${txHash}`
      );
      
      if (!tx || !tx.data) {
        const errorMessage = `Transaction ${txHash} data not available`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      logger.debug(`Successfully fetched transaction ${txHash}, decoding data`);
      
      // Decode the transaction input
      const iface = new ethers.Interface(contract.interface.fragments);
      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      
      if (!decoded) {
        const errorMessage = `Could not decode transaction ${txHash}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      logger.debug(`Decoded transaction ${txHash}: function ${decoded.name}`);
      
      // Check for relevant functions that include a metadataHash
      if (decoded.name === 'registerTool' && decoded.args.length >= 4) {
        // The 4th argument should be the metadataHash
        const metadataHash = decoded.args[3];
        if (metadataHash && typeof metadataHash === 'string') {
          logger.info(`Successfully extracted metadataHash "${metadataHash}" from registerTool transaction`);
          return metadataHash;
        }
      }
      
      if (decoded.name === 'updateToolMetadata' && decoded.args.length >= 4) {
        // The 4th argument is the metadataHash
        const metadataHash = decoded.args[3];
        if (metadataHash && typeof metadataHash === 'string') {
          logger.info(`Successfully extracted metadataHash "${metadataHash}" from updateToolMetadata transaction`);
          return metadataHash;
        }
      }
      
      // If we got here, we couldn't extract the metadata hash
      const errorMessage = `Could not find metadataHash in transaction ${txHash} (function: ${decoded.name})`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    } catch (error: any) {
      logger.error(`Error extracting metadataHash from transaction ${txHash}:`, error);
      throw new Error(`Failed to extract metadataHash from transaction ${txHash}: ${error.message}`);
    }
  }, 3, 1000, 2);
}; 