import { createWebSearchTool } from './agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from './agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from './agents/workflows/twitter/twitterAgent.js';
import { config } from './config/index.js';
import { LLMProvider } from './services/llm/types.js';
import { createTwitterApi } from './services/twitter/client.js';

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //Twitter agent config
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const webSearchTool = createWebSearchTool(config.SERPAPI_API_KEY || '');
  const autoDriveUploadEnabled = config.autoDriveConfig.AUTO_DRIVE_UPLOAD;

  const twitterAgentTool = createTwitterAgent(twitterApi, character, {
    tools: [webSearchTool],
    postTweets: config.twitterConfig.POST_TWEETS,
    autoDriveUploadEnabled,
    monitoring: {
      enabled: true,
    },
  });

  //Orchestrator config
  const prompts = await createPrompts(character, { selfSchedule: true });
  const modelConfigurations = {
    inputModelConfig: {
      provider: LLMProvider.ANTHROPIC,
      model: 'claude-3-5-sonnet-latest',
      temperature: 0.8,
    },
    messageSummaryModelConfig: {
      provider: LLMProvider.OPENAI,
      model: 'gpt-4o',
      temperature: 0.8,
    },
    finishWorkflowModelConfig: {
      provider: LLMProvider.OPENAI,
      model: 'gpt-4o-mini',
      temperature: 0.8,
    },
  };
  return {
    modelConfigurations,
    tools: [twitterAgentTool, webSearchTool],
    prompts,
    autoDriveUploadEnabled,
    monitoring: {
      enabled: true,
    },
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
