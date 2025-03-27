import { ethers } from 'ethers';
import { config } from '../../config/index.js';
import { createLogger } from '../logger.js';

const logger = createLogger('signature-validation');

// Helper function to compare semantic versions
const isVersionLessThanOrEqual = (version1: string, version2: string): boolean => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = i < v1Parts.length ? v1Parts[i] : 0;
    const v2Part = i < v2Parts.length ? v2Parts[i] : 0;

    if (v1Part < v2Part) return true;
    if (v1Part > v2Part) return false;
  }

  return true; // Equal versions should return true for "less than or equal"
}

export const validateMemorySignature = async (
  memoryData: any,
  agentName: string,
): Promise<boolean> => {
  try {
    let memoryType: 'v2' | 'v1' | 'v0';

    if (
      'header' in memoryData &&
      !isVersionLessThanOrEqual(memoryData.header.agentVersion, '0.4.0')
    ) {
      console.log('memoryData.header.agentVersion', memoryData.header.agentVersion);
      memoryType = 'v2';
    } else if (
      'agentVersion' in memoryData &&
      isVersionLessThanOrEqual(memoryData.agentVersion, '0.4.0')
    ) {
      memoryType = 'v1';
    } else {
      memoryType = 'v0';
    }

    switch (memoryType) {
      case 'v2':
        const headerMessageObject = {
          ...memoryData,
          signature: undefined,
        };
        return await verifySignature(headerMessageObject, memoryData.signature, agentName);

      case 'v1':
        const versionMessageObject = {
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
        return await verifySignature(versionMessageObject, memoryData.signature, agentName);

      case 'v0':
        // Legacy memory validation
        const requiredFields = ['signature', 'previousCid', 'timestamp', 'agentAddress'];
        for (const field of requiredFields) {
          if (!(field in memoryData)) {
            logger.warn('Memory rejected: Missing required field', { missingField: field });
            return false;
          }
        }

        const legacyMessageObject = {
          data: memoryData.data || {
            ...memoryData,
            previousCid: undefined,
            timestamp: undefined,
            signature: undefined,
          },
          previousCid: memoryData.previousCid,
          timestamp: memoryData.timestamp,
        };
        return await verifySignature(
          legacyMessageObject,
          memoryData.signature,
          memoryData.agentAddress,
        );
    }
  } catch (error) {
    logger.warn('Memory rejected: Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

const verifySignature = async (
  messageObject: any,
  signature: string,
  agentName: string,
): Promise<boolean> => {
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
