import { config } from 'autonomys-agents-core/src/config/index.js';
import { createLogger } from 'autonomys-agents-core/src/utils/logger.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from 'autonomys-agents-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from 'autonomys-agents-core/src/agents/workflows/orchestrator/prompts.js';
import { HumanMessage } from '@langchain/core/messages';
import { OrchestratorRunnerOptions } from 'autonomys-agents-core/src/agents/workflows/orchestrator/types.js';
import { createSlackTools } from 'autonomys-agents-core/src/agents/tools/slack/index.js';
const logger = createLogger('autonomous-web3-agent');

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  const slackToken = config.slackConfig.SLACK_APP_TOKEN;
  if (!slackToken) {
    throw new Error('SLACK_TOKEN is required in the environment variables');
  }
  const slackTools = await createSlackTools(slackToken);

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [...slackTools],
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
  const initialMessage = `Check for new messages in your channels, reply to interesting ones`;

  try {
    // Use type assertion for HumanMessage to resolve compatibility issue
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
