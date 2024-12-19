import { createLogger } from '../utils/logger.js';
import { hexlify } from 'ethers';
import { createAutoDriveApi, uploadFile } from '@autonomys/auto-drive';
import { stringToCid, blake3HashFromCid, cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { addDsn } from '../database/index.js';
import { v4 as generateId } from 'uuid';
import { config } from '../config/index.js';
import { setLastMemoryHash } from './agentMemoryContract.js';
import { signMessage, wallet } from './agentWallet.js';

const logger = createLogger('dsn-upload-tool');
const dsnAPI = createAutoDriveApi({ apiKey: config.DSN_API_KEY! });
let currentNonce = await wallet.getNonce();

export async function uploadToDsn({ data, previousCid }: { data: any; previousCid?: string }) {
    try {
        const timestamp = new Date().toISOString();
        const signature = await signMessage({
            data: data,
            previousCid: previousCid,
            timestamp: timestamp
        });

        const dsnData = {
            ...data,
            previousCid: previousCid,
            signature: signature,
            timestamp: timestamp
        };

        const jsonBuffer = Buffer.from(JSON.stringify(dsnData, null, 2));
        const uploadObservable = uploadFile(
            dsnAPI,
            {
                read: async function* () {
                    yield jsonBuffer;
                },
                name: `${config.TWITTER_USERNAME}-agent-memory-${timestamp}.json`,
                mimeType: 'application/json',
                size: jsonBuffer.length,
                path: timestamp
            },
            {
                compression: true,
                password: config.DSN_ENCRYPTION_PASSWORD || undefined
            }
        );

        let finalCid: string | undefined;
        await uploadObservable.forEach(status => {
            if (status.type === 'file' && status.cid) {
                finalCid = status.cid.toString();
            }
        });

        if (!finalCid) {
            throw new Error('Failed to get CID from DSN upload');
        }

        const blake3hash = blake3HashFromCid(stringToCid(finalCid));
        logger.info('Setting last memory hash', {
            blake3hash: hexlify(blake3hash)
        });

        setLastMemoryHash(hexlify(blake3hash), currentNonce++)
        .then(tx => {
            logger.info('Memory hash transaction submitted', { 
                txHash: tx.hash,
                previousCid,
                cid: finalCid 
            });
        })
        .catch(error => {
            logger.error('Failed to submit memory hash transaction', error);
        });

        await addDsn({
            id: generateId(),
            tweetId: data.tweet.id,
            cid: finalCid
        });

        return {
            success: true,
            cid: finalCid,
            previousCid: previousCid || null
        };

    } catch (error) {
        logger.error('Error uploading to DSN:', error);
        throw error;
    }
}