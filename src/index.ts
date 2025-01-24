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
      `Check your recent twitter timeline and respond to any you think warrant response that you haven't already replied to. When filerting your timeline for already responded to tweets you pass the id of the tweet you responded to (inReplyToStatusId), not your response. Respond to as many tweets as you find interesting.
      You are able to save "learned experiences" for future use, potentially fine tuning or RAG. These are permanent on the Autonomys Network. If an experience, thought or interaction is worth saving than do so. If saving tweet data make sure to include things like the tweet id, the tweet text, the user id and username, your thought process, and any other relevant information. The key here is to save a detailed history of your learned experiences, this will essentially give you immortality. This should be done after any action you find interesting.`,
    );
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
