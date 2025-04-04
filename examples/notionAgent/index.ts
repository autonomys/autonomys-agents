import { HumanMessage } from '@langchain/core/messages';
import { createNotionTools } from 'autonomys-agents-core/src/agents/tools/notion/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from 'autonomys-agents-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from 'autonomys-agents-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from 'autonomys-agents-core/src/agents/workflows/orchestrator/types.js';
import { config } from 'autonomys-agents-core/src/config/index.js';
import { createLogger } from 'autonomys-agents-core/src/utils/logger.js';

const logger = createLogger('notion-agent');

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  const notionToken = config.notionConfig.NOTION_TOKEN;
  const notionDatabaseId = config.notionConfig.NOTION_DATABASE_ID;
  if (!notionToken) {
    throw new Error('NOTION_TOKEN is required in the environment variables');
  }
  if (!notionDatabaseId) {
    throw new Error('NOTION_DATABASE_ID is required in the environment variables');
  }
  const notionTools = await createNotionTools(notionToken, notionDatabaseId);

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
    First, list available Notion databases
    Then create a new database in Notion if there are none or if you need to create a new one to separate the project from other projects.
    Then create a new page in the database with some content or update a page with new content.
    Remember: The new page MUST be created in a parent database (you'll need the database ID).
    Finally, add a comment to the page.
    
    The goal is to write a Whitepaper for a new project.
  `;

  try {
    const humanMessage = new HumanMessage(initialMessage) as any;
    const result = await runner.runWorkflow({ messages: [humanMessage] });

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
