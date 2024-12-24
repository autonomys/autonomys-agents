import express from 'express';
import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runWorkflow } from './services/agents/workflow.js';
import { initializeSchema } from './database/index.js';
import apiRoutes from './api/index.js';
import { corsMiddleware } from './api/middleware/cors.js';
const logger = createLogger('app');
const app = express();

app.use(corsMiddleware);

app.use(express.json());
app.use(apiRoutes);

const startWorkflowPolling = async () => {
  try {
    await runWorkflow();
    logger.info('Workflow execution completed successfully');
  } catch (error) {
    logger.error('Error running workflow:', error);
  }
};

const main = async () => {
  try {
    await initializeSchema();

    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
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
