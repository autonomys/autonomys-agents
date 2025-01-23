import { createLogger } from '../../utils/logger.js';
import { getLastMemoryCid } from '../../agents/tools/utils/blockchain/agentMemoryContract.js';
import { download } from '../../agents/tools/utils/dsn/dsnDownload.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../../config/index.js';

const logger = createLogger('memory-resurrector');
const STATE_FILE = join(
  config.characterConfig.characterPath,
  'memories',
  'last-processed-cid.json',
);

const getLastProcessedCid = (): string | null => {
  try {
    if (!existsSync(STATE_FILE)) {
      return null;
    }
    const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    return data.lastProcessedCid;
  } catch (error) {
    logger.error('Failed to read last processed CID:', error);
    return null;
  }
};

const saveLastProcessedCid = (cid: string): void => {
  try {
    writeFileSync(STATE_FILE, JSON.stringify({ lastProcessedCid: cid }, null, 2));
    logger.info(`Saved last processed CID: ${cid}`);
  } catch (error) {
    logger.error('Failed to save last processed CID:', error);
  }
};

const fetchMemoryChain = async (
  currentCid: string,
  memoriesToFetch: number | null,
  outputDir: string,
  failedCids: Set<string> = new Set(),
  processedCount = 0,
): Promise<{ processedCount: number; failedCids: Set<string> }> => {
  if (
    !currentCid ||
    failedCids.has(currentCid) ||
    (memoriesToFetch !== null && processedCount >= memoriesToFetch)
  ) {
    return { processedCount, failedCids };
  }

  try {
    const content = await download(currentCid);
    const filename = `${currentCid}.json`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, JSON.stringify(content, null, 2));

    processedCount++;
    logger.info(`Successfully fetched and saved memory ${currentCid}`);

    if (content.previousCid) {
      return fetchMemoryChain(
        content.previousCid,
        memoriesToFetch,
        outputDir,
        failedCids,
        processedCount,
      );
    }
  } catch (error) {
    logger.error(`Failed to fetch memory ${currentCid}:`, error);
    failedCids.add(currentCid);
  }

  return { processedCount, failedCids };
};

const downloadAllMemories = async (
  outputDir: string,
  memoriesToFetch: number | null = null,
): Promise<{ processed: number; failed: number }> => {
  const latestCid = await getLastMemoryCid();
  if (!latestCid) {
    logger.info('No memories found (empty CID)');
    return { processed: 0, failed: 0 };
  }

  const lastProcessedCid = getLastProcessedCid();
  if (lastProcessedCid === latestCid) {
    logger.info('Already up to date with latest CID');
    return { processed: 0, failed: 0 };
  }

  logger.info(
    `Starting download from ${latestCid}${memoriesToFetch ? ` (max ${memoriesToFetch} memories)` : ' to genesis'}`,
  );
  const { processedCount, failedCids } = await fetchMemoryChain(
    latestCid,
    memoriesToFetch,
    outputDir,
  );

  saveLastProcessedCid(latestCid);

  logger.info(`Downloaded ${processedCount} memories, failed CIDs: ${failedCids.size}`);

  return {
    processed: processedCount,
    failed: failedCids.size,
  };
};

export { downloadAllMemories };
