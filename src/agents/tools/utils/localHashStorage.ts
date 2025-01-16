import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('local-hash-storage');
const HASH_FILE = join(process.cwd(), 'memories', 'last-memory-hash.json');
if (!existsSync(join(process.cwd(), 'memories'))) {
  mkdirSync(join(process.cwd(), 'memories'));
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

export const deleteLocalHash = (): void => {
  try {
    unlinkSync(HASH_FILE);
    logger.info('Local hash deleted');
  } catch (error) {
    logger.error('Failed to delete local hash:', error);
  }
};
