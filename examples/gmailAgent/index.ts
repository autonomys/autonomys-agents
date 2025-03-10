import { HumanMessage } from '@langchain/core/messages';
import { createGmailTools } from '../../src/agents/tools/gmail/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '../../src/agents/workflows/orchestrator/types.js';
import { validateLocalHash } from '../../src/blockchain/localHashStorage.js';
import { config } from '../../src/config/index.js';
import { createLogger } from '../../src/utils/logger.js';

const logger = createLogger('autonomous-web3-agent');

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  // Gmail configuration
  const gmailEmail = process.env.GMAIL_EMAIL;
  const gmailPassword = process.env.GMAIL_PASSWORD;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailEmail || !gmailPassword || !gmailAppPassword) {
    throw new Error(
      'GMAIL_EMAIL and (GMAIL_PASSWORD or GMAIL_APP_PASSWORD) are required in the environment variables',
    );
  }

  const gmailTools = await createGmailTools({
    email: gmailEmail,
    password: gmailPassword,
    appPassword: gmailAppPassword,
  });

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [...gmailTools],
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

  // Initial message to check for emails from Marc
  const initialMessage = `Read recent emails and only reply to messages that are from Marc-Aurèle. For each message from Marc-Aurèle:
1. Read the content carefully
2. Compose a thoughtful and relevant reply
3. Send the reply using the send_gmail tool`;

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
