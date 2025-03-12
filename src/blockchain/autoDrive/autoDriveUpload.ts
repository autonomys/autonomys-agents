import { blake3HashFromCid, stringToCid } from '@autonomys/auto-dag-data';
import { uploadFile, UploadFileOptions } from '@autonomys/auto-drive';
import { hexlify } from 'ethers';
import { agentVersion, characterName, config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';
import { getLastMemoryCid, setLastMemoryHash } from '../autoEvm/agentMemoryContract.js';
import { signMessage, wallet } from '../autoEvm/agentWallet.js';
import { autoDriveApi } from './autoDriveApi.js';
import { withRetry } from './retry.js';

const logger = createLogger('dsn-upload-tool');

let currentNonce = await wallet.getNonce();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uploadFileToDsn = async (file: any, options: UploadFileOptions) =>
  withRetry(() => uploadFile(autoDriveApi, file, options), { operationName: 'Dsn file upload' });

// Helper function for memory hash
const submitMemoryHash = async (hash: string, nonce: number) =>
  withRetry(() => setLastMemoryHash(hash, nonce), { operationName: 'Memory hash submission' });

export async function uploadToDsn(data: object) {
  logger.info('Upload to Dsn - Starting upload');
  const previousCid = await getLastMemoryCid();
  logger.info('Previous CID', { previousCid });

  if ('timestamp' in data) delete data.timestamp;
  if ('agentVersion' in data) delete data.agentVersion;
  if ('previousCid' in data) delete data.previousCid;

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
    const fileName = `${characterName}-agent-${agentVersion}-memory-${timestamp}.json`;
    const file = {
      read: async function* () {
        yield jsonBuffer;
      },
      name: fileName,
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
