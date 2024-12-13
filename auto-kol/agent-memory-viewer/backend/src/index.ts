import { initialize } from './db/init.js';
import { resurrection } from './utils/resurrection.js';
import { watchMemoryHashUpdates } from './utils/agentMemoryContract.js';
import { downloadMemory } from './utils/dsn.js';
import { saveMemoryRecord } from './db/index.js';
import { createLogger } from './utils/logger.js';
import app from './server.js';

const logger = createLogger('main');

async function main() {
    await initialize();
    await resurrection();

    const memoryWatcher = watchMemoryHashUpdates(async (agent, cid) => {
        try {
            logger.info('New memory hash detected', { agent, cid });
            const memory = await downloadMemory(cid);
            if (memory) {
                await saveMemoryRecord(cid, memory, memory?.previousCid);
                logger.info('Successfully saved new memory', { cid });
            }
        } catch (error) {
            logger.error('Error processing memory update', { error, agent, cid });
        }
    });

    process.on('SIGINT', () => {
        logger.info('Shutting down memory watcher');
        memoryWatcher();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        logger.info('Shutting down memory watcher');
        memoryWatcher();
        process.exit(0);
    });

    app.listen(3010, () => {
        logger.info('Server is running on port 3010');
    });
}

main().catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
});