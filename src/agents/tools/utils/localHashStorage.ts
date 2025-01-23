import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createLogger } from '../../../utils/logger.js';
import { getLastMemoryHashSetTimestamp } from './blockchain/agentMemoryContract.js';
import { config } from '../../../config/index.js';

const logger = createLogger('local-hash-storage');
const HASH_FILE = join(config.characterConfig.characterPath, 'memories', 'last-memory-hash.json');
if (!existsSync(join(config.characterConfig.characterPath, 'memories'))) {
  mkdirSync(join(config.characterConfig.characterPath, 'memories'));
}

interface StoredHash {
  hash: string;
  timestamp: string;
}

export const saveHashLocally = (hash: string): void => {
  try {
    const data: StoredHash = {
      hash,
      timestamp: new Date().toISOString(),
    };
    writeFileSync(HASH_FILE, JSON.stringify(data, null, 2));
    logger.info('Hash saved locally', { hash });
  } catch (error) {
    logger.error('Failed to save hash locally:', error);
  }
};

export const getLocalHash = (): string | null => {
  try {
    if (!existsSync(HASH_FILE)) {
      return null;
    }
    const data = JSON.parse(readFileSync(HASH_FILE, 'utf-8')) as StoredHash;
    return data.hash;
  } catch (error) {
    logger.error('Failed to read local hash:', error);
    return null;
  }
};

export const validateLocalHash = async (): Promise<void> => {
  try {
    if (!existsSync(HASH_FILE)) {
      return;
    }
    const data = JSON.parse(readFileSync(HASH_FILE, 'utf-8')) as StoredHash;
    const { timestamp: eventTimestamp, hash: eventHash } = await getLastMemoryHashSetTimestamp();
    const localTimestamp = new Date(data.timestamp).getTime() / 1000;

    if (eventTimestamp > localTimestamp) {
      logger.info('Local hash is outdated, invalidating. Saving and updating the latest hash.');
      saveHashLocally(eventHash);
    } else {
      logger.info('Local hash is up to date');
    }
  } catch (error) {
    logger.error('Failed to validate local hash:', error);
  }
};
