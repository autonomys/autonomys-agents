import { getObjectMetadata } from '@autonomys/auto-drive';
import { config } from '../../config/index.js';
import { isMemoryV2_0_0 } from '../../types/generated/v2_0_0.js';
import { createLogger } from '../logger.js';
import { validateLegacyMemory } from './signature.js';
import { validateSignature } from './signature.js';

const logger = createLogger('memory-validation');



export async function validateMemoryMetadata(api: any, cid: string): Promise<boolean> {
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

export async function validateMemoryData(memoryData: any): Promise<boolean> {
    if (!memoryData || typeof memoryData !== 'object') {
        logger.warn('Memory rejected: Invalid memory data format', {
            type: typeof memoryData
        });
        return false;
    }
    if (isMemoryV2_0_0(memoryData)) {
        logger.info('Memory validated as version 2.0.0');
        return await validateSignature(memoryData);
    }
    logger.info('Memory validated as legacy version');
    return await validateLegacyMemory(memoryData);
} 