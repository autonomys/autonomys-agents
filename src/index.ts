import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runWorkflow } from './agents/workflows/kol/workflow.js';

const logger = createLogger('app');

// Get character name from command line args
const characterId = process.argv[2];
if (!characterId) {
  logger.error('Please provide a character name as an argument (e.g., yarn dev argumint)');
  process.exit(1);
}

// Strip any file extension
const cleanCharacterId = characterId.replace(/\.(ya?ml)$/, '');

const startWorkflowPolling = async () => {
  try {
    const _result = await runWorkflow(cleanCharacterId);
    logger.info('Workflow execution completed successfully');
  } catch (error) {
    logger.error('Error running workflow:', error);
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
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

main();
