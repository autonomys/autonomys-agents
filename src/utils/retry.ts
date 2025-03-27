type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  shouldRetry?: (error: Error) => boolean;
};

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  { maxRetries = 5, initialDelay = 1000, shouldRetry = () => true }: RetryOptions = {},
): Promise<T> => {
  let retries = 0;
  let lastError: Error;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      retries++;

      if (retries >= maxRetries || !shouldRetry(lastError)) {
        break;
      }

      const backoffTime = initialDelay * Math.pow(2, retries - 1);
      await delay(backoffTime);
    }
  }
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw lastError!;
};
