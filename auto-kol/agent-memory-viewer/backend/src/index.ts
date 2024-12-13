import { saveMemoryRecord } from './db/index.js';
import { getLastMemoryHash } from './utils/agentMemoryContract.js';
import { downloadMemory } from './utils/dsn.js';
import { initialize, resetDatabase } from './db/init.js';
import app from './server.js';

async function main() {
    await initialize();
    const hash = await getLastMemoryHash();
    const memory = await downloadMemory(hash);
    await resetDatabase();
    await saveMemoryRecord(hash, memory, memory?.previous_cid);
    app.listen(8000, () => {
        console.log('Server is running on port 8000');
    });
}

main();