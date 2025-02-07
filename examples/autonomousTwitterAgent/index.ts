import { config } from '../../src/config/index.js';
import { createLogger } from '../../src/utils/logger.js';
import { validateLocalHash } from '../../src/agents/tools/utils/localHashStorage.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTools } from '../../src/agents/workflows/orchestrator/tools.js';
import { createTwitterAgentTool } from '../../src/agents/workflows/twitter/twitterAgentTool.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { LLMProvider } from '../../src/services/llm/types.js';
import { PruningParameters } from '../../src/agents/workflows/orchestrator/types.js';
import { LLMFactory } from '../../src/services/llm/factory.js';
import { createTwitterApi } from '../../src/services/twitter/client.js';
import { HumanMessage } from '@langchain/core/messages';
import { createWebSearchTool } from '../../src/agents/tools/webSearchTool.js';

const logger = createLogger('autonomous-twitter-agent');

const orchestatorConfig = async () => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const webSearchTool = createWebSearchTool();
  const twitterAgent = createTwitterAgentTool(twitterApi, [webSearchTool]);

  const namespace = 'orchestrator';
  const { tools } = createTools();
  const prompts = await createPrompts({ selfSchedule: true });
  const pruningParameters: PruningParameters = {
    maxWindowSummary: 30,
    maxQueueSize: 50,
  };
  const model = LLMFactory.createModel({
    provider: LLMProvider.ANTHROPIC,
    model: 'claude-3-5-sonnet-latest',
    temperature: 0,
  });
  return {
    model,
    namespace,
    tools: [...tools, twitterAgent, webSearchTool],
    prompts,
    pruningParameters,
  };
};

const orchestratorConfig = await orchestatorConfig();
const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(
        orchestratorConfig.model,
        orchestratorConfig.tools,
        orchestratorConfig.prompts,
        orchestratorConfig.namespace,
        orchestratorConfig.pruningParameters,
      );
    }
    return runnerPromise;
  };
})();

const main = async () => {
  const runner = await orchestratorRunner();
  const initalMessage = `As a social media manager, you are expected to interact with twitter periodically in order to maintain social engagement. Use your judgement how frequently you should run these interactions and what you should do. You don't need do the same things every time. Save any interesting experiences from your interactions your permanent storage. 

  **RESEARCH**
  Feel free to conduct research on a topic using the web search tool. This could be used to augment your knowledge or to get more information about a topic before posting a new tweet or to validate the information in a tweet before liking or retweeting it. Or use it to research a topic in preparation for your next workflow run.

  EXAMPLES:
  - Check your timeline for interesting conversations and join the conversation.
  - Like interesting tweets.
  - Follow interesting users.
  - Check your mentions and reply to useful conversations that you haven't replied to yet.
  - Post a new tweet.
  - Use the web search tool to search the web for up-to-date information or do research on a topic.
`;
  try {
    await validateLocalHash();

    let message = initalMessage;
    while (true) {
      const result = await runner.runWorkflow({ messages: [new HumanMessage(message)] });

      message = `${result.workflowSummary}\n${result.nextWorkflowPrompt ?? message}`;

      logger.info('Workflow execution result:', { result });

      const nextDelaySeconds =
        result.secondsUntilNextWorkflow ?? config.twitterConfig.RESPONSE_INTERVAL_MS / 1000;
      logger.info('Workflow execution completed successfully for character:', {
        charcterName: config.characterConfig.name,
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
