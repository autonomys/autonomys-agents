import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runWorkflow } from './agents/workflows/kol/workflow.js';

const logger = createLogger('app');

const startWorkflowPolling = async () => {
  try {
    const result = await runWorkflow();
    logger.info('Workflow execution completed successfully');
  } catch (error) {
    logger.error('Error running workflow:', error);
  }
};

const main = async () => {
  try {
    await startWorkflowPolling();
    setInterval(startWorkflowPolling, config.CHECK_INTERVAL);

    logger.info('Application started successfully', {
      checkInterval: config.CHECK_INTERVAL,
      port: config.PORT,
    });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

main();
