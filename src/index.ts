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

const initialMessage = `As a social media manager, you are expected to interact with twitter periodically in order to maintain social engagement. Use your judgement how frequently you should run these interactions and what you should do. You don't need do the same things every time.

  - Check your timeline for interesting conversations and join the conversation.
  - Like interesting tweets.
  - Follow interesting users.
  - Check your mentions and reply to useful conversations that you haven't replied to yet.
  - Post a new tweet.

  Save all actions results and experiences from your interactions to Autonomy Network's DSN.
`;

const main = async () => {
  try {
    await validateLocalHash();
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    const initialTaskTime = new Date();
    initialTaskTime.setSeconds(initialTaskTime.getSeconds());

    runner.scheduleTask(initialMessage, initialTaskTime);
    logger.info(`Initial task scheduled for ${initialTaskTime.toISOString()}`);

    logger.info('Starting task executor...');
    const _stopTaskExecutor = startTaskExecutor(runner);

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
