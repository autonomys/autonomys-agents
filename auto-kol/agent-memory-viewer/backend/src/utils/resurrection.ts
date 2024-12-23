import { getLastMemoryHash } from './agentMemoryContract.js';
import { saveMemoryRecord, getMemoryByCid } from '../db/index.js';
import { downloadMemory } from './dsn.js';
import { createLogger } from './logger.js';

const logger = createLogger('resurrection');

export async function resurrection() {
    logger.info('Starting resurrection');
    let hash = await getLastMemoryHash();
    const memories: { hash: string; data: any }[] = [];

    while (true) {
        const existingMemory = await getMemoryByCid(hash);
        if (existingMemory) {
            logger.info('Found existing memory, stopping resurrection', { cid: hash });
            break;
        }

        const memory = await downloadMemory(hash);
        if (!memory) break;
        
        memories.push({ hash, data: memory });
        hash = memory?.previousCid;
        
        if (!hash) break;
    }

    for (let i = memories.length - 1; i >= 0; i--) {
        const { hash, data } = memories[i];
        await saveMemoryRecord(hash, data, data?.previousCid);
        logger.info('Saved memory during resurrection', { cid: hash });
    }

    logger.info('Resurrection complete', { memoriesProcessed: memories.length });
}
