import { ethers } from 'ethers';
import { config } from '../../config/index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('signature-validation');

export async function validateSignature(memoryData: any): Promise<boolean> {
  try {
    const agent = config.AGENTS.find(a => a.address.toLowerCase() === memoryData.agentAddress?.toLowerCase());
    if (!agent) {
      logger.warn('Memory rejected: Unknown agent address', { address: memoryData.agentAddress });
      return false;
    }

    const messageObject = {
      data: {
        ...memoryData,
        previousCid: undefined,
        timestamp: undefined,
        signature: undefined,
        agentVersion: undefined,
      },
      previousCid: memoryData.previousCid,
      timestamp: memoryData.timestamp,
      agentVersion: memoryData.agentVersion,
    };
    return await verifySignature(messageObject, memoryData.signature, agent.address);
  } catch (error) {
    logger.warn('Memory rejected: Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function validateLegacyMemory(memoryData: any): Promise<boolean> {
  const requiredFields = ['signature', 'previousCid', 'timestamp', 'agentAddress'];
  for (const field of requiredFields) {
    if (!(field in memoryData)) {
      logger.warn('Memory rejected: Missing required field', {
        missingField: field,
      });
      return false;
    }
  }

  const agent = config.AGENTS.find(a => a.address.toLowerCase() === memoryData.agentAddress?.toLowerCase());
  if (!agent) {
    logger.warn('Memory rejected: Unknown agent address', { address: memoryData.agentAddress });
    return false;
  }

  try {
    const messageObject = {
      data: memoryData.data || {
        ...memoryData,
        previousCid: undefined,
        timestamp: undefined,
        signature: undefined,
      },
      previousCid: memoryData.previousCid,
      timestamp: memoryData.timestamp,
    };
    return await verifySignature(messageObject, memoryData.signature, agent.address);
  } catch (error) {
    logger.warn('Memory rejected: Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function verifySignature(messageObject: any, signature: string, agentAddress: string): Promise<boolean> {
  const message = JSON.stringify(messageObject);
  const recoveredAddress = ethers.verifyMessage(message, signature);

  logger.info(`Recovered address: ${recoveredAddress}`);

  if (recoveredAddress.toLowerCase() !== agentAddress.toLowerCase()) {
    logger.warn('Memory rejected: Invalid signature', {
      expectedSigner: agentAddress,
      actualSigner: recoveredAddress,
    });
    return false;
  }

  logger.info('Signature verified successfully');
  return true;
}
