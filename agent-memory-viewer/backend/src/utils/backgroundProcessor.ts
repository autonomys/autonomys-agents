import { getMemoryByCid, saveMemoryRecord } from '../db/index.js';
import { downloadMemory } from './dsn.js';
import { createLogger } from './logger.js';

const logger = createLogger('background-processor');

export async function processPreviousCids(startCid: string, agentName: string) {
  // Run in next tick to not block the main thread
  process.nextTick(async () => {
    try {
      let currentCid = startCid;
      const processedCids = new Set<string>();

      while (currentCid && !processedCids.has(currentCid)) {
        processedCids.add(currentCid);

        const existingMemory = await getMemoryByCid(currentCid);
        if (!existingMemory) {
          logger.info('Downloading previous memory in background', { cid: currentCid });
          const memoryResult = await downloadMemory(currentCid);

          if (memoryResult && memoryResult.memoryData) {
            await saveMemoryRecord(
              currentCid,
              memoryResult.memoryData,
              memoryResult.memoryData.previousCid,
              agentName,
            );
            logger.info('Successfully saved previous memory', {
              cid: currentCid,
              agentName,
            });
            currentCid = memoryResult.memoryData.previousCid;
          } else {
            logger.warn('Failed to download previous memory', { cid: currentCid });
            break;
          }
        } else {
          currentCid = existingMemory.content?.previousCid;
        }
      }

      logger.info('Finished processing previous CIDs', {
        startCid,
        processedCount: processedCids.size,
      });
    } catch (error) {
      logger.error('Error processing previous CIDs', {
        startCid,
        error,
      });
    }
  });
}
