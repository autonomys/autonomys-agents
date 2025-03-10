import { HumanMessage } from '@langchain/core/messages';
import { createNotionTools } from '../../src/agents/tools/notion/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '../../src/agents/workflows/orchestrator/types.js';
import { validateLocalHash } from '../../src/blockchain/localHashStorage.js';
import { config } from '../../src/config/index.js';
import { createLogger } from '../../src/utils/logger.js';

const logger = createLogger('notion-agent');

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  const notionToken = config.notionConfig.NOTION_TOKEN;
  if (!notionToken) {
    throw new Error('NOTION_TOKEN is required in the environment variables');
  }
  const notionTools = await createNotionTools(notionToken);

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [...notionTools],
    prompts,
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(character, orchestrationConfig);
    }
    return runnerPromise;
  };
})();

const main = async () => {
  const runner = await orchestratorRunner();

  // Choose which message to start with
  const initialMessage = `
    First, list available Notion databases.
    Then create a new page in one of those databases with some content.
    Remember: The new page MUST be created in a parent database (you'll need the database ID).
    Finally, add a comment to the page.
    
    The goal is to write a Whitepaper for a new project.
  `;

  try {
    await validateLocalHash();

    const result = await runner.runWorkflow({ messages: [new HumanMessage(initialMessage)] });

    logger.info('Workflow execution result:', { summary: result.summary });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
      logger.info('Process terminated by user');
      process.exit(0);
    }
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

main();
