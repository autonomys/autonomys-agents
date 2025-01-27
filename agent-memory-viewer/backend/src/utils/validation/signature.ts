import { ethers } from 'ethers';
import { config } from '../../config/index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('signature-validation');

export async function validateMemorySignature(
  memoryData: any,
  agentName: string,
): Promise<boolean> {
  try {
    if ('agentVersion' in memoryData) {
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
      return await verifySignature(messageObject, memoryData.signature, agentName);
    }
    // Legacy memory validation
    else {
      const requiredFields = ['signature', 'previousCid', 'timestamp', 'agentAddress'];
      for (const field of requiredFields) {
        if (!(field in memoryData)) {
          logger.warn('Memory rejected: Missing required field', { missingField: field });
          return false;
        }
      }

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
      return await verifySignature(messageObject, memoryData.signature, memoryData.agentAddress);
    }
  } catch (error) {
    logger.warn('Memory rejected: Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function verifySignature(
  messageObject: any,
  signature: string,
  agentName: string,
): Promise<boolean> {
  // print config.AGENTS
  console.log('config.AGENTS', config.AGENTS);
  console.log('agentName', agentName);
  const agent = config.AGENTS.find(a => a.username === agentName);
  if (!agent) {
    logger.warn('Memory rejected: Unknown agent address', { address: agentName });
    return false;
  }

  const message = JSON.stringify(messageObject);
  const recoveredAddress = ethers.verifyMessage(message, signature);

  logger.info(`Recovered address: ${recoveredAddress}`);

  if (recoveredAddress.toLowerCase() !== agent.address.toLowerCase()) {
    logger.warn('Memory rejected: Invalid signature', {
      expectedSigner: agent.address,
      actualSigner: recoveredAddress,
    });
    return false;
  }

  logger.info('Signature verified successfully');
  return true;
}
