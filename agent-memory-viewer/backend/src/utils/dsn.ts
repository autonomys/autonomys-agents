import axios from 'axios';
import { inflate } from 'pako';
import { createLogger } from './logger.js';
import { validateMemoryData } from './validation/memory.js';

const logger = createLogger('dsn');

const MAX_RETRIES = 15;
const INITIAL_RETRY_DELAY = 10000;

const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const downloadMemory = async (
  cid: string,
  retryCount = 0,
): Promise<{ memoryData: any; agentName: string } | null> => {
  try {
    logger.info(`Downloading memory: ${cid}`);
    const memory = await axios.get(`https://gateway.autonomys.xyz/file/${cid}`);

    if (!memory.data.header.agentName) {
      logger.error('Memory rejected: File name does not contain any known agent username');
      return null;
    }
    const isValidData = await validateMemoryData(memory.data, memory.data.header.agentName);
    if (!isValidData) {
      return null;
    }

    return {
      memoryData: memory.data,
      agentName: memory.data.header.agentName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Not Found') || errorMessage.includes('incorrect header check')) {
      logger.warn('Memory error, skipping retries', {
        cid,
        error: errorMessage,
      });
      return null;
    }

    if (retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logger.warn(`Failed to download memory, retrying in ${retryDelay}ms`, {
        cid,
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES,
        error: errorMessage,
      });

      await delay(retryDelay);
      return downloadMemory(cid, retryCount + 1);
    }

    logger.error('Failed to download memory after max retries', {
      cid,
      maxRetries: MAX_RETRIES,
      error: errorMessage,
    });
    throw error;
  }
};
