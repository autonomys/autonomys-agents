import { createLogger } from '../../../utils/logger.js';
import { hexlify } from 'ethers';
import { createAutoDriveApi, uploadFile } from '@autonomys/auto-drive';
import { stringToCid, blake3HashFromCid } from '@autonomys/auto-dag-data';
import { config, agentVersion } from '../../../config/index.js';
import { wallet, signMessage } from './agentWallet.js';
import { setLastMemoryHash, getLastMemoryCid } from './agentMemoryContract.js';
import { saveHashLocally } from './localHashStorage.js';

const logger = createLogger('dsn-upload-tool');
const dsnApi = createAutoDriveApi({ apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY! });
let currentNonce = await wallet.getNonce();

// New retry utility function
const withRetry = async <T>(
  operation: () => Promise<T>,
  {
    maxRetries = 5,
    initialDelayMs = 1000,
    operationName = 'Operation',
  }: {
    maxRetries?: number;
    initialDelayMs?: number;
    operationName?: string;
  } = {},
): Promise<T> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const attempt = async (retriesLeft: number, currentDelay: number): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retriesLeft <= 0) {
        logger.error(`${operationName} failed after all retry attempts`, { error });
        throw error;
      }

      logger.warn(`${operationName} failed, retrying... (${retriesLeft} attempts left)`, {
        error,
        nextDelayMs: currentDelay,
      });
      await delay(currentDelay);
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
      const nextDelay = Math.min(currentDelay * 2 * jitter, 30000); // Cap at 30 seconds
      return attempt(retriesLeft - 1, nextDelay);
    }
  };

  return attempt(maxRetries, initialDelayMs);
};

// Helper function for file upload
const uploadFileToDsn = async (file: any, options: any) =>
  withRetry(() => uploadFile(dsnApi, file, options), { operationName: 'Dsn file upload' });

// Helper function for memory hash
const submitMemoryHash = async (hash: string, nonce: number) =>
  withRetry(() => setLastMemoryHash(hash, nonce), { operationName: 'Memory hash submission' });

export async function uploadToDsn(data: object) {
  logger.info('Upload to Dsn - Starting upload');
  const previousCid = await getLastMemoryCid();
  logger.info('Previous CID', { previousCid });

  try {
    const timestamp = new Date().toISOString();
    const signature = await signMessage({
      data: data,
      previousCid: previousCid,
      timestamp: timestamp,
      agentVersion: agentVersion,
    });

    const dsnData = {
      ...data,
      previousCid: previousCid,
      signature: signature,
      timestamp: timestamp,
      agentVersion: agentVersion,
    };

    logger.info('Upload to Dsn - DSN Data', { dsnData });

    const jsonBuffer = Buffer.from(JSON.stringify(dsnData, null, 2));
    const file = {
      read: async function* () {
        yield jsonBuffer;
      },
      name: `${config.twitterConfig.USERNAME}-agent-memory-${timestamp}.json`,
      mimeType: 'application/json',
      size: jsonBuffer.length,
    };

    const uploadedCid = await uploadFileToDsn(file, {
      compression: true,
      password: config.autoDriveConfig.AUTO_DRIVE_ENCRYPTION_PASSWORD || undefined,
    });

    const blake3hash = blake3HashFromCid(stringToCid(uploadedCid));
    logger.info('Setting last memory hash', {
      blake3hash: hexlify(blake3hash),
    });
    // Temporary fix
    saveHashLocally(hexlify(blake3hash));

    const tx = await submitMemoryHash(hexlify(blake3hash), currentNonce++);
    logger.info('Memory hash transaction submitted', {
      txHash: tx.hash,
      previousCid,
      cid: uploadedCid,
    });

    return {
      success: true,
      cid: uploadedCid,
      previousCid: previousCid || null,
    };
  } catch (error) {
    logger.error('Error uploading to Dsn:', error);
    throw error;
  }
}
