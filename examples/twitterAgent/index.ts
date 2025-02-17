import { config } from '../../src/config/index.js';
import { createLogger } from '../../src/utils/logger.js';
import { validateLocalHash } from '../../src/blockchain/localHashStorage.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTwitterAgentTool } from '../../src/agents/workflows/twitter/twitterAgent.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { LLMProvider } from '../../src/services/llm/types.js';
import { createTwitterApi } from '../../src/services/twitter/client.js';
import { HumanMessage } from '@langchain/core/messages';
import { createWebSearchTool } from '../../src/agents/tools/webSearch/index.js';
import { OrchestratorRunnerOptions } from '../../src/agents/workflows/orchestrator/types.js';

const logger = createLogger('autonomous-twitter-agent');

const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //Twitter agent config
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const webSearchTool = createWebSearchTool(config.SERPAPI_API_KEY || '');
  const autoDriveUploadEnabled = config.autoDriveConfig.AUTO_DRIVE_UPLOAD;
  const twitterAgentTool = createTwitterAgentTool(twitterApi, {
    tools: [webSearchTool],
    postTweets: config.twitterConfig.POST_TWEETS,
    autoDriveUploadEnabled,
  });

  //Orchestrator config
  const prompts = await createPrompts({ selfSchedule: true });
  const modelConfig = {
    provider: LLMProvider.ANTHROPIC,
    model: 'claude-3-5-sonnet-latest',
    temperature: 0.8,
  };
  return {
    modelConfig,
    tools: [twitterAgentTool, webSearchTool],
    prompts,
    autoDriveUploadEnabled,
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(orchestrationConfig);
    }
    return runnerPromise;
  };
})();

const main = async () => {
  const runner = await orchestratorRunner();
  const initialMessage = `As a social media manager, you are expected to interact with twitter periodically in order to maintain social engagement. Save any interesting experiences from your interactions your permanent storage. 

  EXAMPLES:
  - Check your timeline and ENGAGE IN INTERESTING CONVERSATIONS.
  - DO NOT NEGLECT CHECKING MENTIONS AND ENGAGING IN CONVERSATIONS.
  - Post a new tweet.
  - Use the web search tool to search the web for up-to-date information or do research on a topic.

  DO NOT NEGLECT ANY OF THE ABOVE EXAMPLES PLEASE
`;
  try {
    await validateLocalHash();

    let message = initialMessage;
    while (true) {
      const result = await runner.runWorkflow({ messages: [new HumanMessage(message)] });

      message = `${result.summary}
      Overarching instructions: ${initialMessage}
      ${result.nextWorkflowPrompt ?? message}`;

      logger.info('Workflow execution result:', { result });

      const nextDelaySeconds = result.secondsUntilNextWorkflow ?? 3600;
      logger.info('Workflow execution completed successfully for character:', {
        characterName: config.characterConfig.name,
        runFinished: new Date().toISOString(),
        nextRun: `${nextDelaySeconds / 60} minutes`,
        nextWorkflowPrompt: message,
      });
      await new Promise(resolve => setTimeout(resolve, nextDelaySeconds * 1000));
    }
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
