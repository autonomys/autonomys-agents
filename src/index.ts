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
    const _result = await runOrchestratorWorkflow(
      `You are expected to run the twitter workflow periodically in order to maintain social engagement. The current date and time is ${new Date().toISOString()}`,
    );

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
