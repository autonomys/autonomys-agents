import { createGitHubTools } from './agents/tools/github/index.js';
import { createSlackTools } from './agents/tools/slack/index.js';
import { createWebSearchTool } from './agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from './agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from './agents/workflows/twitter/twitterAgent.js';
import { createApiServer, registerRunnerWithApi, withApiLogger } from './api/server.js';
import { config } from './config/index.js';
import { createTwitterApi } from './services/twitter/client.js';
const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //shared twitter agent and orchestrator config
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;

  //Twitter agent config
  const twitterAgentTool =
    config.twitterConfig.USERNAME && config.twitterConfig.PASSWORD
      ? [
          createTwitterAgent(
            await createTwitterApi(
              config.twitterConfig.USERNAME,
              config.twitterConfig.PASSWORD,
              config.twitterConfig.COOKIES_PATH,
            ),
            character,
            {
              tools: [...webSearchTool],
              postTweets: config.twitterConfig.POST_TWEETS,
              saveExperiences,
              monitoring: {
                enabled: monitoringEnabled,
              },
              modelConfigurations: config.twitterConfig.model_configurations,
            },
          ),
        ]
      : [];

  //If slack api key is provided, add slack tools
  const slackTools = config.slackConfig.SLACK_APP_TOKEN
    ? await createSlackTools(config.slackConfig.SLACK_APP_TOKEN)
    : [];

  //If github api key is provided, add github tools
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = config.githubConfig;
  const githubTools =
    GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO
      ? await createGitHubTools(GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)
      : [];

  //Orchestrator config
  const prompts = await createPrompts(character, { selfSchedule: true });

  return {
    modelConfigurations: config.orchestratorConfig.model_configurations,
    tools: [...twitterAgentTool, ...webSearchTool, ...slackTools, ...githubTools],
    prompts,
    saveExperiences,
    monitoring: {
      enabled: monitoringEnabled,
    },
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    const apiServer = createApiServer();
    if (!runnerPromise) {
      const namespace = 'orchestrator';

      runnerPromise = createOrchestratorRunner(character, {
        ...orchestrationConfig,
        ...withApiLogger(namespace),
      });
      runnerPromise = registerRunnerWithApi(runnerPromise, apiServer, namespace);
    }
    return runnerPromise;
  };
})();
