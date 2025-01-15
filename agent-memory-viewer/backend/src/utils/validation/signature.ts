import { ethers } from 'ethers';
import { config } from '../../config/index.js';
import { createLogger } from '../logger.js';
import type { MemoryV2_0_0 } from '../../types/generated/v2_0_0.js';

const logger = createLogger('signature-validation');

export async function validateSignature(memoryData: MemoryV2_0_0): Promise<boolean> {
    try {
        const messageObject = {
            data:  {
                ...memoryData,
                previousCid: undefined,
                timestamp: undefined,
                signature: undefined,
                agentVersion: undefined
            },
            previousCid: memoryData.previousCid,
            timestamp: memoryData.timestamp,
            agentVersion: memoryData.agentVersion
        };
        return await verifySignature(messageObject, memoryData.signature);
    } catch (error) {
        logger.warn('Memory rejected: Signature verification failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

export async function validateLegacyMemory(memoryData: any): Promise<boolean> {
    const requiredFields = ['signature', 'previousCid', 'timestamp'];
    for (const field of requiredFields) {
        if (!(field in memoryData)) {
            logger.warn('Memory rejected: Missing required field', {
                missingField: field
            });
            return false;
        }
    }

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
        return await verifySignature(messageObject, memoryData.signature);
    } catch (error) {
        logger.warn('Memory rejected: Signature verification failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

async function verifySignature(messageObject: any, signature: string): Promise<boolean> {
    const message = JSON.stringify(messageObject);
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
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
} 