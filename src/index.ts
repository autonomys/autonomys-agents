import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { getOrchestratorRunner } from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { validateLocalHash } from './agents/tools/utils/localHashStorage.js';
import { createTools } from './agents/workflows/orchestrator/tools.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { createTwitterApi } from './services/twitter/client.js';
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

export const orchestatorConfig = async () => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const { tools } = createTools(twitterApi);

  const prompts = await createPrompts();
  return { prompts, tools };
};
const orchestratorConfig = await orchestatorConfig();
const orchestratorRunner = await getOrchestratorRunner(orchestratorConfig);

const startWorkflowPolling = async () => {
  try {
    const initalMessage = new HumanMessage(`
      You are expected to run the twitter workflow periodically in order to maintain social engagement.
    `);

    const result = await orchestratorRunner.runWorkflow({ messages: [initalMessage] });

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
