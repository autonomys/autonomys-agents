import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runOrchestratorWorkflow } from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { validateLocalHash } from './agents/tools/utils/localHashStorage.js';

const logger = createLogger('app');

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

const startWorkflowPolling = async () => {
  try {
    const _result = await runOrchestratorWorkflow('Run the twitter workflow');
    logger.info(
      'Workflow execution completed successfully for character:',
      config.characterConfig.name,
    );
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
