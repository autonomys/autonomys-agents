import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { validateLocalHash } from './blockchain/localHashStorage.js';
import { orchestratorRunner } from './agent.js';
import { HumanMessage } from '@langchain/core/messages';
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

const initialMessage = `
 - ONLY fetch the time.
`;

const main = async () => {
  try {
    await validateLocalHash();

    // Initialize the orchestrator runner
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    // Schedule the initial task (if needed)
    const initialTaskTime = new Date();
    initialTaskTime.setSeconds(initialTaskTime.getSeconds() + 5); // Start in 5 seconds

    runner.scheduleTask(initialMessage, initialTaskTime);
    logger.info(`Initial task scheduled for ${initialTaskTime.toISOString()}`);

    // Start the task executor to handle scheduled tasks
    logger.info('Starting task executor...');
    const stopTaskExecutor = startTaskExecutor(runner);

    logger.info('Application initialized and ready to process scheduled tasks');

    // Keep the process alive indefinitely
    return new Promise(() => {
      // This promise intentionally never resolves
    });
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
