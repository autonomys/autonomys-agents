import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { validateLocalHash } from './blockchain/localHashStorage.js';
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

    let message = initialMessage;
    while (true) {
      const result = await runner.runWorkflow({ messages: [new HumanMessage(message)] });

      message = `${result.summary}\n${result.nextWorkflowPrompt ?? message}`;

      logger.info('Workflow execution result:', { result });

      const nextDelaySeconds = result.secondsUntilNextWorkflow ?? 3600;
      logger.info('Workflow execution completed successfully for character:', {
        characterName: config.characterConfig.name,
        runFinished: new Date().toISOString(),
        nextRun: `${nextDelaySeconds / 60} minutes`,
        nextWorkflowPrompt: message,
      });
      await new Promise(resolve => setTimeout(resolve, nextDelaySeconds * 1000));
    }
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
