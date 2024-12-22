import { initialize } from './db/init.js';
import { resurrection } from './utils/resurrection.js';
import { watchMemoryHashUpdates } from './utils/agentMemoryContract.js';
import { downloadMemory } from './utils/dsn.js';
import { saveMemoryRecord } from './db/index.js';
import { createLogger } from './utils/logger.js';
import app from './server.js';
import { config } from './config/index.js';
import { createWebSocketServer, closeWebSocketServer } from './websocket.js';

const logger = createLogger('main');

process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception:', error);
    await closeWebSocketServer();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason, promise });
    await closeWebSocketServer();
    process.exit(1);
});

async function main() {
    try {
        await initialize();
        await resurrection();

        const memoryWatcher = watchMemoryHashUpdates(async (agent, cid) => {
            try {
                logger.info('New memory hash detected', { agent, cid });
                const memory = await downloadMemory(cid);
                if (memory) {
                    const savedMemory = await saveMemoryRecord(cid, memory, memory?.previousCid);
                    logger.info('Memory processed successfully', { 
                        cid,
                        isNew: savedMemory.created_at === savedMemory.created_at 
                    });
                }
            } catch (error) {
                logger.error('Error processing memory update', { 
                    error,
                    agent,
                    cid,
                    errorType: error instanceof Error ? error.constructor.name : typeof error
                });
            }
        });

        createWebSocketServer();

        const cleanup = async () => {
            logger.info('Shutting down services');
            const stopWatcher = await memoryWatcher;
            await stopWatcher();
            await closeWebSocketServer();
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        const port = config.PORT || 3010;
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        await closeWebSocketServer();
        process.exit(1);
    }
}

main().catch(async (error) => {
    logger.error('Fatal error:', error);
    await closeWebSocketServer();
    process.exit(1);
});