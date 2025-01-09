import { getMemoryByCid, saveMemoryRecord } from '../db/index.js';
import { downloadMemory } from './dsn.js';
import { createLogger } from './logger.js';

const logger = createLogger('background-processor');

export async function processPreviousCids(startCid: string) {
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
                    const memoryData = await downloadMemory(currentCid);
                    
                    if (memoryData) {
                        await saveMemoryRecord(currentCid, memoryData, memoryData?.previousCid);
                        logger.info('Successfully saved previous memory', { cid: currentCid });
                        currentCid = memoryData?.previousCid;
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
                processedCount: processedCids.size 
            });
        } catch (error) {
            logger.error('Error processing previous CIDs', { 
                startCid, 
                error 
            });
        }
    });
} 