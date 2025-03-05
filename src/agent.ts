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
import { createApiServer, withApiIntegration, registerRunnerWithApi } from './api/server.js';

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //shared twitter agent and orchestrator config
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;

  //Twitter agent config
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);

  const twitterAgentTool = createTwitterAgent(twitterApi, character, {
    tools: [...webSearchTool],
    postTweets: config.twitterConfig.POST_TWEETS,
    saveExperiences,
    monitoring: {
      enabled: monitoringEnabled,
    },
    modelConfigurations: config.twitterConfig.model_configurations,
  });

  //Orchestrator config
  const prompts = await createPrompts(character, { selfSchedule: true });

  return {
    modelConfigurations: config.orchestratorConfig.model_configurations,
    tools: [twitterAgentTool, ...webSearchTool],
    prompts,
    saveExperiences,
    monitoring: {
      enabled: monitoringEnabled,
    },
  };
};

const apiServer = createApiServer();

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      // Create the runner with API integration options
      const namespace = 'orchestrator';

      // withApiIntegration now handles creating and enhancing the logger
      runnerPromise = createOrchestratorRunner(
        character,
        withApiIntegration(apiServer, {
          ...orchestrationConfig,
          namespace,
        }),
      );

      // Register the runner with the API after creation
      // This keeps the registration logic in the API layer where it belongs
      if (apiServer) {
        runnerPromise = registerRunnerWithApi(runnerPromise, apiServer, namespace);
      }
    }
    return runnerPromise;
  };
})();
