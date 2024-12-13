import { saveMemoryRecord } from './db/index.js';
import { getLastMemoryHash } from './utils/agentMemoryContract.js';
import { downloadMemory } from './utils/dsn.js';
import { initialize, resetDatabase } from './db/init.js';
import { resurrection } from './utils/resurrection.js';
import app from './server.js';

async function main() {
    await initialize();
    await resurrection();
    app.listen(8000, () => {
        console.log('Server is running on port 8000');
    });
}

main();