import { createLogger } from '../../utils/logger.js';

const logger = createLogger('retry-utils');

/**
 * Retry an operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @param factor Exponential factor for increasing delay
 * @returns Result of the operation
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000, // 1 second
  factor: number = 2 // Exponential factor
): Promise<T> => {
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
}; 