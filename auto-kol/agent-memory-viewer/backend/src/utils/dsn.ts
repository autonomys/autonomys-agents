import { createAutoDriveApi, downloadObject } from '@autonomys/auto-drive';
import { config } from '../config/index.js';
import { inflate } from 'pako';
import { createLogger } from './logger.js';

const logger = createLogger('dsn');

const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 10000;

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadMemory(cid: string, retryCount = 0): Promise<any> {
    try {
        const api = createAutoDriveApi({ 
            apiKey: config.DSN_API_KEY || '' 
        });
        
        const stream = await downloadObject(api, { cid: cid });
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
        return memoryData;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('Not Found')) {
            logger.warn('Memory not found, skipping retries', {
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