import { initialize } from './db/init.js';
import { resurrection } from './utils/resurrection.js';
// import { watchMemoryHashUpdates } from './utils/agentMemoryContract.js';
import { startMemoryPolling } from './utils/memoryPoller.js';
// import { downloadMemory } from './utils/dsn.js';
// import { saveMemoryRecord } from './db/index.js';
import { createLogger } from './utils/logger.js';
import app from './server.js';
import { config } from './config/index.js';
import { createWebSocketServer, closeWebSocketServer } from './websocket.js';

const logger = createLogger('main');

process.on('uncaughtException', async error => {
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
    // resurrection();

    // Using polling instead of subscription
    // const memoryWatcher = watchMemoryHashUpdates(async (agent, cid) => {
    //   logger.info('New memory hash detected', { agent, cid });
    //
    //   downloadMemory(cid)
    //     .then(async memory => {
    //       if (memory) {
    //         const agentConfig = config.AGENTS.find(
    //           a => a.address.toLowerCase() === agent.toLowerCase(),
    //         );
    //         const savedMemory = await saveMemoryRecord(
    //           cid,
    //           memory?.memoryData,
    //           memory?.memoryData?.previousCid,
    //           agentConfig?.username || 'unknown_agent',
    //         );
    //         logger.info('Memory processed successfully', {
    //           cid,
    //           isNew: savedMemory.created_at === savedMemory.created_at,
    //         });
    //       }
    //     })
    //     .catch(error => {
    //       logger.error('Error processing memory update', {
    //         error,
    //         agent,
    //         cid,
    //         errorType: error instanceof Error ? error.constructor.name : typeof error,
    //       });
    //     });
    // });

    // Start memory polling (check every 30 seconds by default)
    const stopPolling = startMemoryPolling();

    createWebSocketServer();

    const cleanup = async () => {
      logger.info('Shutting down services');
      // const stopWatcher = await memoryWatcher;
      // await stopWatcher();
      stopPolling();
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

main().catch(async error => {
  logger.error('Fatal error:', error);
  await closeWebSocketServer();
  process.exit(1);
});
