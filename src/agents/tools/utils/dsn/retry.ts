import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('retry-utility');

export const withRetry = async <T>(
  operation: () => Promise<T>,
  {
    maxRetries = 5,
    initialDelayMs = 1000,
    operationName = 'Operation',
    shouldRetry = (_error: unknown): boolean => true,
  } = {},
): Promise<T> => {
  const attempt = async (retriesLeft: number, currentDelay: number): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (!shouldRetry(error) || retriesLeft <= 0) {
        logger.error(`${operationName} failed after all retry attempts`, { error });
        throw error;
      }

      logger.warn(`${operationName} failed, retrying... (${retriesLeft} attempts left)`, {
        error,
        nextDelayMs: currentDelay,
      });

      await new Promise(resolve => setTimeout(resolve, currentDelay));
      const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
      const nextDelay = Math.min(currentDelay * 2 * jitter, 30000); // Cap at 30 seconds
      return attempt(retriesLeft - 1, nextDelay);
    }
  };

  return attempt(maxRetries, initialDelayMs);
};
