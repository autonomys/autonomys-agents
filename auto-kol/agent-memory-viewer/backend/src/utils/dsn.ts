import { createAutoDriveApi, downloadObject, getObjectMetadata } from '@autonomys/auto-drive';
import { config } from '../config/index.js';
import { inflate } from 'pako';
import { createLogger } from './logger.js';
import { ethers } from 'ethers';

const logger = createLogger('dsn');

const MAX_RETRIES = 15;
const INITIAL_RETRY_DELAY = 10000;

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateMemoryMetadata(api: any, cid: string): Promise<boolean> {
    try {
        const metadata = await getObjectMetadata(api, { cid });
        // Check if filename contains AGENT_ADDRESS
        const agentAddressLower = config.AGENT_USERNAME.toLowerCase();
        if (!metadata?.name?.toLowerCase().includes(agentAddressLower)) {
            logger.warn('Memory rejected: File name does not contain agent address', {
                cid,
                filename: metadata.name,
                agentAddress: config.AGENT_USERNAME
            });
            return false;
        }

        const totalSize = Number(metadata.totalSize);
        if (totalSize > 102400) {
            logger.warn('Memory rejected: File size exceeds 100KB limit', {
                cid,
                size: totalSize
            });
            return false;
        }

        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Not Found')) {
            logger.warn('Memory not found, skipping download', {
                cid,
                error: errorMessage
            });
            return false;
        }
        throw error;
    }
}

async function validateMemoryData(memoryData: any): Promise<boolean> {
    if (!memoryData || typeof memoryData !== 'object') {
        logger.warn('Memory rejected: Invalid memory data format', {
            type: typeof memoryData
        });
        return false;
    }

    const requiredFields = ['signature', 'previousCid', 'timestamp'];
    for (const field of requiredFields) {
        if (!(field in memoryData)) {
            logger.warn('Memory rejected: Missing required field', {
                missingField: field
            });
            return false;
        }
    }

    // Validate signature
    try {
        const messageObject = {
            data: memoryData.data || {
                ...memoryData,
                previousCid: undefined,
                timestamp: undefined,
                signature: undefined
            },
            previousCid: memoryData.previousCid,
            timestamp: memoryData.timestamp
        };
        const message = JSON.stringify(messageObject);
        const recoveredAddress = ethers.verifyMessage(message, memoryData.signature);
        logger.info(`Recovered address: ${recoveredAddress}`);
        const expectedAddress = config.AGENT_ADDRESS;
        if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
            logger.warn('Memory rejected: Invalid signature', {
                expectedSigner: expectedAddress,
                actualSigner: recoveredAddress
            });
            return false;
        }
        
        logger.info('Signature verified successfully');
        return true;
    } catch (error) {
        logger.warn('Memory rejected: Signature verification failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

export async function downloadMemory(cid: string, retryCount = 0): Promise<any> {
    logger.info(`Checking memory metadata: ${cid}`);
    try {
        const api = createAutoDriveApi({ 
            apiKey: config.DSN_API_KEY || '' 
        });
        
        const isValid = await validateMemoryMetadata(api, cid);
        if (!isValid) {
            return null;
        }
        logger.info(`Memory metadata is valid: ${cid}`);

        logger.info(`Downloading memory: ${cid}`);
        const stream = await downloadObject(api, { cid });
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let position = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }

        const decompressed = inflate(allChunks);
        const jsonString = new TextDecoder().decode(decompressed);
        const memoryData = JSON.parse(jsonString);
        
        const isValidData = await validateMemoryData(memoryData);
        if (!isValidData) {
            return null;
        }

        return memoryData;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('Not Found') || 
            errorMessage.includes('incorrect header check')) {
            logger.warn('Memory error, skipping retries', {
                cid,
                error: errorMessage
            });
            return null;
        }

        if (retryCount < MAX_RETRIES) {
            const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            logger.warn(`Failed to download memory, retrying in ${retryDelay}ms`, {
                cid,
                retryCount: retryCount + 1,
                maxRetries: MAX_RETRIES,
                error: errorMessage
            });
            
            await delay(retryDelay);
            return downloadMemory(cid, retryCount + 1);
        }

        logger.error('Failed to download memory after max retries', {
            cid,
            maxRetries: MAX_RETRIES,
            error: errorMessage
        });
        throw error;
    }
}
