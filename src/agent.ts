import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTwitterAgent } from './agents/workflows/twitter/twitterAgent.js';
import { config } from './config/index.js';
import { createTwitterApi } from './services/twitter/client.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { LLMProvider } from './services/llm/types.js';
import { OrchestratorRunnerOptions } from './agents/workflows/orchestrator/types.js';
import { createWebSearchTool } from './agents/tools/webSearch/index.js';

const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //Twitter agent config
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const webSearchTool = createWebSearchTool(config.SERPAPI_API_KEY || '');
  const autoDriveUploadEnabled = config.autoDriveConfig.AUTO_DRIVE_UPLOAD;
  const twitterAgentTool = createTwitterAgent(twitterApi, {
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
