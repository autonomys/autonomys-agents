import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { validateLocalHash } from './agents/tools/utils/localHashStorage.js';
import { orchestratorRunner } from './agent.js';
import { HumanMessage } from '@langchain/core/messages';
export const logger = createLogger('app');

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

const runner = await orchestratorRunner();
const startWorkflowPolling = async () => {
  try {
    const initalMessage = new HumanMessage(`
      As a social media manager, you are expected to interact with twitter periodically in order to maintain social engagement. Use your judgement how frequently you should run these interactions and what you should do. For efficiency, just have one or two tasks per request. You don't need do the same things every time. Save any interesting experiences from your interactions your permanent storage.

      EXAMPLES:
      - Check your timiline for interesting conversations and join the conversation.
      - Like interesting tweets.
      - Follow interesting users.
      - Check your mentions and reply to useful conversations that you haven't replied to yet.
      - Post a new tweet.
    `);

    const _result = await runner.runWorkflow({ messages: [initalMessage] });

    logger.info('Workflow execution completed successfully for character:', {
      charcterName: config.characterConfig.name,
      runFinished: new Date().toISOString(),
      nextRun: `${config.twitterConfig.RESPONSE_INTERVAL_MS / 1000 / 60} minutes`,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
      logger.info('Process terminated by user');
      process.exit(0);
    }
    logger.error('Error running workflow:', error);
    process.exit(1);
  }
};

const main = async () => {
  try {
    await validateLocalHash();
    await startWorkflowPolling();
    setInterval(startWorkflowPolling, config.twitterConfig.RESPONSE_INTERVAL_MS);
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
