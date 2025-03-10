import { createLogger } from './utils/logger.js';
import { validateLocalHash } from './blockchain/localHashStorage.js';
import { orchestratorRunner } from './agent.js';
import { startTaskExecutor } from './agents/workflows/orchestrator/scheduler/taskExecutor.js';
export const logger = createLogger('app');

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});


const main = async () => {
  try {
    await validateLocalHash();
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    logger.info('Starting task executor...');
    const _stopTaskExecutor = startTaskExecutor(runner, 'orchestrator');

    logger.info('Application initialized and ready to process scheduled tasks');
    return new Promise(() => {});
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
      logger.info('Process terminated by user');
      process.exit(0);
    }
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

main();
