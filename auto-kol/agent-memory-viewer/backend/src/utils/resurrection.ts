import { getLastMemoryHash } from './agentMemoryContract.js';
import { saveMemoryRecord } from '../db/index.js';
import { resetDatabase } from '../db/init.js';
import { downloadMemory } from './dsn.js';

export async function resurrection() {
    console.log('Starting resurrection');
    await resetDatabase();
    let hash = await getLastMemoryHash();

    while (true) {
        const memory = await downloadMemory(hash);
        await saveMemoryRecord(hash, memory, memory?.previousCid);
        hash = memory?.previousCid;
        if (!hash) {
            break;
        }
    }

    console.log('Resurrection complete');
}