import { createWebSearchTool } from './agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from './agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from './agents/workflows/twitter/twitterAgent.js';
import { config } from './config/index.js';
import { createTwitterApi } from './services/twitter/client.js';
import { withApiLogger } from './api/server.js';
import { createSlackAgent } from './agents/workflows/slack/slackAgent.js';
import { createAllSchedulerTools } from './agents/tools/scheduler/index.js';
import { createGitHubTools } from './agents/tools/github/index.js';
import { registerOrchestratorRunner } from './agents/workflows/registration.js';

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //shared twitter agent and orchestrator config
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;
  const schedulerTools = createAllSchedulerTools();

  //Twitter agent config
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);

  const twitterAgentTool = createTwitterAgent(twitterApi, character, {
    tools: [...webSearchTool, ...schedulerTools],
    postTweets: config.twitterConfig.POST_TWEETS,
    saveExperiences,
    monitoring: {
      enabled: monitoringEnabled,
    },
    modelConfigurations: config.twitterConfig.model_configurations,
  });

  //If slack api key is provided, add slack tools
  const slackAgentTool = config.slackConfig.SLACK_APP_TOKEN
    ? [createSlackAgent(config.slackConfig.SLACK_APP_TOKEN, character, {
        tools: [...schedulerTools],
        saveExperiences,
        monitoring: {
          enabled: monitoringEnabled,
        },
      })]
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
    tools: [twitterAgentTool, ...slackAgentTool, ...webSearchTool, ...githubTools, ...schedulerTools],
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
    if (!runnerPromise) {
      const namespace = 'orchestrator';

      runnerPromise = createOrchestratorRunner(character, {
        ...orchestrationConfig,
        ...withApiLogger(namespace),
      });
      const runner = await runnerPromise;
      registerOrchestratorRunner(namespace, runner);
    }
    return runnerPromise;
  };
})();
