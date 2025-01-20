import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runWorkflow } from './agents/workflows/twitter/workflow.js';
import { onboarding } from './cli/onboarding.js';

const logger = createLogger('app');

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

const characterId = process.argv[2];

const startWorkflowPolling = async () => {
  try {
    const character = await onboarding(characterId);
    const _result = await runWorkflow(character.character);
    logger.info('Workflow execution completed successfully for character:', character.character);
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
    await startWorkflowPolling();
    setInterval(startWorkflowPolling, config.twitterConfig.RESPONSE_INTERVAL_MS);

    logger.info('Application started successfully', {
      checkInterval: config.twitterConfig.RESPONSE_INTERVAL_MS / 1000 / 60,
      username: config.twitterConfig.USERNAME,
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
