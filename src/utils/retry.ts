type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  shouldRetry?: (error: Error) => boolean;
  timeout?: number; // Total time in milliseconds before giving up
};

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });

  return Promise.race([
    promise
      .then(result => {
        clearTimeout(timeoutId);
        return result;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        throw error;
      }),
    timeoutPromise,
  ]);
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  { maxRetries = 5, initialDelay = 1000, shouldRetry = () => true, timeout }: RetryOptions = {},
): Promise<T> => {
  let retries = 0;
  let lastError: Error;

  while (retries < maxRetries) {
    try {
      return await (timeout ? withTimeout(fn(), timeout) : fn());
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
