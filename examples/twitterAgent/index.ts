import { createWebSearchTool } from '@autonomys/agent-core/src/agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '@autonomys/agent-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '@autonomys/agent-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '@autonomys/agent-core/src/agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from '@autonomys/agent-core/src/agents/workflows/twitter/twitterAgent.js';
import { getConfig } from '@autonomys/agent-core/src/config/index.js';
import { createTwitterApi } from '@autonomys/agent-core/src/agents/tools/twitter/client.js';
import { createLogger } from '@autonomys/agent-core/src/utils/logger.js';
import { createAllSchedulerTools } from '@autonomys/agent-core/src/agents/tools/scheduler/index.js';
import { createExperienceManager } from '@autonomys/agent-core/src/blockchain/agentExperience/index.js';
import { parseArgs } from '@autonomys/agent-core/src/utils/args.js';
import { createApiServer, withApiLogger } from '@autonomys/agent-core/src/api/server.js';
import { startTaskExecutor } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskExecutor.js';
import { createDefaultChatTools } from '@autonomys/agent-core/src/agents/chat/tools.js';
import { createChatWorkflow } from '@autonomys/agent-core/src/agents/chat/workflow.js';
import { LLMConfiguration } from '@autonomys/agent-core/src/services/llm/types.js';
import { createChatNodeConfig } from '@autonomys/agent-core/src/agents/chat/config.js';
import { registerOrchestratorRunner } from '@autonomys/agent-core/src/agents/workflows/registration.js';
import { createTaskQueue } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskQueue.js';

parseArgs();

const logger = createLogger('autonomous-twitter-agent');

// Get the config instance
const configInstance = await getConfig();
if (!configInstance) {
  throw new Error('Config instance not found');
}
const { config, agentVersion, characterName } = configInstance;
const character = config.characterConfig;

const apiConfig = {
  apiEnabled: config.ENABLE_API,
  authFlag: config.apiSecurityConfig.ENABLE_AUTH,
  authToken: config.apiSecurityConfig.API_TOKEN ?? '',
  port: config.API_PORT,
  allowedOrigins: config.apiSecurityConfig.CORS_ALLOWED_ORIGINS,
};

const chatAppInstance = async (): Promise<any> => {
  const modelConfig: LLMConfiguration = {
    model: 'gpt-4o-mini',
    provider: 'openai',
    temperature: 0.5,
  };
  const tools = createDefaultChatTools(config.characterConfig.characterPath);
  const chatNodeConfig = createChatNodeConfig({ modelConfig, tools });
  const chatAppInstance = createChatWorkflow(chatNodeConfig);
  return chatAppInstance;
}

const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  const dataPath = character.characterPath;
  //shared twitter agent and orchestrator config
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;
  const schedulerTools = createAllSchedulerTools();
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
            tools: [...webSearchTool, ...schedulerTools],
            postTweets: config.twitterConfig.POST_TWEETS,
            experienceConfig,
            monitoringConfig,
            modelConfigurations: config.twitterConfig.model_configurations,
            characterDataPathConfig: {
              dataPath,
            },
            apiConfig,
          }
        )
      ]
      : [];

  //Orchestrator config
  //use default orchestrator prompts with character config from CLI
  const prompts = await createPrompts(character);

  //override default model configurations for summary and finish workflow nodes
  const modelConfigurations = {
    messageSummaryModelConfig: {
      provider: 'openai' as const,
      model: 'gpt-4o',
      temperature: 0.8,
    },
    finishWorkflowModelConfig: {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      temperature: 0.8,
    },
  };
  return {
    modelConfigurations,
    tools: [...twitterAgentTool, ...webSearchTool],
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
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      const namespace = 'orchestrator';
      runnerPromise = createOrchestratorRunner(configInstance.config.characterConfig, {
        ...orchestrationConfig,
        ...withApiLogger(namespace, orchestrationConfig.apiConfig ? true : false),
      });
      const runner = await runnerPromise;
      registerOrchestratorRunner(namespace, runner);
    }
    return runnerPromise;
  };
})();

const main = async () => {

  const _createApiServer = createApiServer({
    characterName: characterName,
    dataPath: config.characterConfig.characterPath,
    authFlag: config.apiSecurityConfig.ENABLE_AUTH,
    authToken: config.apiSecurityConfig.API_TOKEN ?? '',
    apiPort: config.API_PORT,
    allowedOrigins: config.apiSecurityConfig.CORS_ALLOWED_ORIGINS,
    chatAppInstance: await chatAppInstance(),
  });

  const initialMessage = `Check your timeline, engage with posts and find an interesting topic to tweet about.`;

  try {
    const logger = createLogger('app');
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    const taskQueue = createTaskQueue('orchestrator', config.characterConfig.characterPath);
    
    // Scheduling the first task manually
    // The task will be executed immediately
    taskQueue.scheduleTask(initialMessage, new Date());
    logger.info('Starting task executor...');
    const _startTaskExecutor = startTaskExecutor(runner, 'orchestrator');
    logger.info('Application initialized and ready to process scheduled tasks');
    return new Promise(() => { });
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
