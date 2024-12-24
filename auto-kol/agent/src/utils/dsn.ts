import { createLogger } from '../utils/logger.js';
import { hexlify } from 'ethers';
import { createAutoDriveApi, uploadFile } from '@autonomys/auto-drive';
import { stringToCid, blake3HashFromCid, cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { addDsn, getLastDsnCid } from '../database/index.js';
import { v4 as generateId } from 'uuid';
import { config } from '../config/index.js';
import { setLastMemoryHash, getLastMemoryCid } from './agentMemoryContract.js';
import { signMessage, wallet } from './agentWallet.js';

const logger = createLogger('dsn-upload-tool');
const dsnAPI = createAutoDriveApi({ apiKey: config.DSN_API_KEY! });
let currentNonce = await wallet.getNonce();

interface RetryOptions {
  maxRetries: number;
  delay: number;
  onRetry?: (error: Error, attempt: number) => void;
}

async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, delay, onRetry } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay * attempt + jitter));
    }
  }

  throw lastError!;
}

const getPreviousCid = async (): Promise<string> => {
  const dsnLastCid = await getLastDsnCid();
  if (dsnLastCid) {
    logger.info('Using last CID from local db', { cid: dsnLastCid });
    return dsnLastCid;
  }

  const memoryLastCid = await getLastMemoryCid();
  logger.info('Using fallback CID source', {
    memoryLastCid: memoryLastCid || 'not found',
  });

  return memoryLastCid || '';
};

export async function uploadToDsn({ data }: { data: any }) {
  const maxRetries = 5;
  const retryDelay = 2000;
  const previousCid = await getPreviousCid();

  try {
    const timestamp = new Date().toISOString();
    const signature = await signMessage({
      data: data,
      previousCid: previousCid,
      timestamp: timestamp,
    });

    const dsnData = {
      ...data,
      previousCid: previousCid,
      signature: signature,
      timestamp: timestamp,
    };

    const jsonBuffer = Buffer.from(JSON.stringify(dsnData, null, 2));

    let finalCid: string | undefined;
    await retry(
      async () => {
        const uploadObservable = uploadFile(
          dsnAPI,
          {
            read: async function* () {
              yield jsonBuffer;
            },
            name: `${config.TWITTER_USERNAME}-agent-memory-${timestamp}.json`,
            mimeType: 'application/json',
            size: jsonBuffer.length,
            path: timestamp,
          },
          {
            compression: true,
            password: config.DSN_ENCRYPTION_PASSWORD || undefined,
          },
        );

        await uploadObservable.forEach(status => {
          if (status.type === 'file' && status.cid) {
            finalCid = status.cid.toString();
          }
        });

        if (!finalCid) {
          throw new Error('Failed to get CID from DSN upload');
        }
      },
      {
        maxRetries,
        delay: retryDelay,
        onRetry: (error, attempt) => {
          logger.warn(`DSN upload attempt ${attempt} failed:`, {
            error: error.message,
            tweetId: data.tweet?.id,
          });
        },
      },
    );

    if (!finalCid) {
      throw new Error('Failed to get CID from DSN upload after retries');
    }

    const blake3hash = blake3HashFromCid(stringToCid(finalCid));
    logger.info('Setting last memory hash', {
      blake3hash: hexlify(blake3hash),
    });

    await retry(
      async () => {
        const tx = await setLastMemoryHash(hexlify(blake3hash), currentNonce++);
        logger.info('Memory hash transaction submitted', {
          txHash: tx.hash,
          previousCid,
          cid: finalCid,
        });
        return tx;
      },
      {
        maxRetries,
        delay: retryDelay,
        onRetry: (error, attempt) => {
          logger.warn(`Blockchain transaction attempt ${attempt} failed:`, {
            error: error.message,
            cid: finalCid,
          });
        },
      },
    ).catch(error => {
      logger.error('Failed to submit memory hash transaction', error);
    });

    await addDsn({
      id: generateId(),
      tweetId: data.tweet.id,
      cid: finalCid,
    });

    return {
      success: true,
      cid: finalCid,
      previousCid: previousCid || null,
    };
  } catch (error) {
    logger.error('Error uploading to DSN:', error);
    throw error;
  }
}
