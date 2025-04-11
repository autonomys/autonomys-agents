import { GitHubToolsSubset } from './agents/tools/github/index.js';
import { createAllSchedulerTools } from './agents/tools/scheduler/index.js';
import { createWebSearchTool } from './agents/tools/webSearch/index.js';
import { createGithubAgent } from './agents/workflows/github/githubAgent.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import {
  ModelConfigurations,
  OrchestratorRunnerOptions,
} from './agents/workflows/orchestrator/types.js';
import { registerOrchestratorRunner } from './agents/workflows/registration.js';
import { createSlackAgent } from './agents/workflows/slack/slackAgent.js';
import { createTwitterAgent } from './agents/workflows/twitter/twitterAgent.js';
import { CreateApiServerParams, withApiLogger } from './api/server.js';
import { getConfig } from './config/index.js';
import { createTwitterApi } from './agents/tools/twitter/client.js';
import { createExperienceManager } from './blockchain/agentExperience/index.js';
import { LLMConfiguration } from './services/llm/types.js';
import { createApiServer } from './api/server.js';
import { createFirecrawlTools } from './agents/tools/firecrawl/index.js';

// Get the config instance
const configInstance = await getConfig();
const { config, agentVersion, characterName } = configInstance;

export const bigModel: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-latest',
  temperature: 0.6,
};
export const smallModel: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-haiku-latest',
  temperature: 0.6,
};
export const modelConfigurations: ModelConfigurations = {
  inputModelConfig: bigModel,
  messageSummaryModelConfig: smallModel,
  finishWorkflowModelConfig: smallModel,
};

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //shared config
  const dataPath = character.characterPath;

  let apiConfig: OrchestratorRunnerOptions['apiConfig'] | undefined;
  if (config.ENABLE_API) {
    apiConfig = {
      apiEnabled: true,
      authFlag: config.apiSecurityConfig.ENABLE_AUTH,
      authToken: config.apiSecurityConfig.API_TOKEN,
      allowedOrigins: config.apiSecurityConfig.CORS_ALLOWED_ORIGINS,
      port: config.API_PORT,
    };
    const createApiServerParams: CreateApiServerParams = {
      characterName,
      dataPath,
      authFlag: apiConfig.authFlag ?? false,
      authToken: apiConfig.authToken ?? '',
      apiPort: apiConfig.port ?? 3000,
      allowedOrigins: apiConfig.allowedOrigins ?? [],
      llmConfig: config.llmConfig,
    };
    const _apiServer = createApiServer(createApiServerParams);
  }
  const firecrawlTools = config.FIRECRAWL_API_KEY
    ? await createFirecrawlTools(config.FIRECRAWL_API_KEY)
    : [];
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];

  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;
  const experienceManager =
    (saveExperiences || monitoringEnabled) &&
    config.blockchainConfig.PRIVATE_KEY &&
    config.blockchainConfig.RPC_URL &&
    config.blockchainConfig.CONTRACT_ADDRESS &&
    config.autoDriveConfig.AUTO_DRIVE_API_KEY
      ? await createExperienceManager({
          autoDriveApiOptions: {
            apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY,
            network: config.autoDriveConfig.AUTO_DRIVE_NETWORK,
          },
          uploadOptions: {
            compression: true,
            password: config.autoDriveConfig.AUTO_DRIVE_ENCRYPTION_PASSWORD,
          },
          walletOptions: {
            privateKey: config.blockchainConfig.PRIVATE_KEY,
            rpcUrl: config.blockchainConfig.RPC_URL,
            contractAddress: config.blockchainConfig.CONTRACT_ADDRESS,
          },
          agentOptions: {
            agentVersion: agentVersion,
            agentName: characterName,
            agentPath: character.characterPath,
          },
        })
      : undefined;

  const experienceConfig =
    saveExperiences && experienceManager
      ? {
          saveExperiences: true as const,
          experienceManager,
        }
      : {
          saveExperiences: false as const,
        };

  const monitoringConfig =
    monitoringEnabled && experienceManager
      ? {
          enabled: true as const,
          monitoringExperienceManager: experienceManager,
        }
      : {
          enabled: false as const,
        };

  const schedulerTools = createAllSchedulerTools();

  // Twitter agent config
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
              tools: [...webSearchTool, ...firecrawlTools, ...schedulerTools],
              postTweets: config.twitterConfig.POST_TWEETS,
              experienceConfig,
              monitoringConfig,
              modelConfigurations: config.twitterConfig.model_configurations,
              characterDataPathConfig: {
                dataPath,
              },
              apiConfig,
            },
          ),
        ]
      : [];

  // TODO: add slack and github model configurations when updating agent tool configurations
  // If slack api key is provided, add slack tools
  const slackAgentTool = config.slackConfig.SLACK_APP_TOKEN
    ? [
        createSlackAgent(config.slackConfig.SLACK_APP_TOKEN, character, {
          tools: [...schedulerTools],
          experienceConfig,
          monitoringConfig,
          modelConfigurations,
          characterDataPathConfig: {
            dataPath,
          },
          apiConfig,
        }),
      ]
    : [];

  // If github api key is provided, add github tools
  const githubToken = config.githubConfig.GITHUB_TOKEN;
  const githubAgentTools = githubToken
    ? [
        createGithubAgent(githubToken, GitHubToolsSubset.ISSUES_CONTRIBUTOR, character, {
          tools: [...schedulerTools],
          experienceConfig,
          monitoringConfig,
          modelConfigurations,
          characterDataPathConfig: {
            dataPath,
          },
          apiConfig,
        }),
      ]
    : [];

  // Orchestrator config
  const prompts = await createPrompts(character);

  return {
    modelConfigurations: config.orchestratorConfig.model_configurations,
    tools: [
      ...twitterAgentTool,
      ...slackAgentTool,
      ...webSearchTool,
      ...firecrawlTools,
      ...githubAgentTools,
      ...schedulerTools,
    ],
    prompts,
    experienceConfig:
      saveExperiences && experienceManager
        ? { saveExperiences: true, experienceManager }
        : { saveExperiences: false },
    monitoringConfig:
      monitoringEnabled && experienceManager
        ? {
            enabled: true,
            monitoringExperienceManager: experienceManager,
          }
        : {
            enabled: false,
          },
    characterDataPathConfig: {
      dataPath,
    },
    apiConfig,
    llmConfig: config.llmConfig,
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
        ...withApiLogger(namespace, orchestrationConfig.apiConfig ? true : false),
      });
      const runner = await runnerPromise;
      registerOrchestratorRunner(namespace, runner);
    }
    return runnerPromise;
  };
})();
