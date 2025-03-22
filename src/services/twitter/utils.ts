import { createLogger } from '../../utils/logger.js';

const logger = createLogger('twitter-api');

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> => {
  let retries = 0;
  let lastError: Error;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      retries++;
      if (retries >= maxRetries) break;

      const backoffTime = initialDelay * Math.pow(2, retries - 1);
      logger.info(`Retry attempt ${retries}/${maxRetries} after ${backoffTime}ms delay`);
      await delay(backoffTime);
    }
  }
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw lastError!;
};
