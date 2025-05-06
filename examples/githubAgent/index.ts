import { GitHubToolsSubset } from '@autonomys/agent-core/src/agents/tools/github/index.js';
import { createAllSchedulerTools } from '@autonomys/agent-core/src/agents/tools/scheduler/index.js';
import { createGithubAgent } from '@autonomys/agent-core/src/agents/workflows/github/githubAgent.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '@autonomys/agent-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '@autonomys/agent-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '@autonomys/agent-core/src/agents/workflows/orchestrator/types.js';
import { getConfig } from '@autonomys/agent-core/src/config/index.js';
import { createExperienceManager } from '@autonomys/agent-core/src/blockchain/agentExperience/index.js';
import { createLogger } from '@autonomys/agent-core/src/utils/logger.js';
import { parseArgs } from '@autonomys/agent-core/src/utils/args.js';
import { createChatWorkflow } from '@autonomys/agent-core/src/agents/chat/workflow.js';
import { createDefaultChatTools } from '@autonomys/agent-core/src/agents/chat/tools.js';
import { createChatNodeConfig } from '@autonomys/agent-core/src/agents/chat/config.js';
import { LLMConfiguration } from '@autonomys/agent-core/src/services/llm/types.js';
import { createTaskQueue } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskQueue.js';
import { startTaskExecutor } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskExecutor.js';
import { createApiServer, withApiLogger } from '@autonomys/agent-core/src/api/server.js';
import { registerOrchestratorRunner } from '@autonomys/agent-core/src/agents/workflows/registration.js';

parseArgs();

const logger = createLogger('autonomous-web3-agent');

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

// Chat app instance
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
          agentName: character.name,
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

  const githubToken = config.githubConfig.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required in the environment variables');
  }
  const githubAgentTools = githubToken
    ? [
      createGithubAgent(githubToken, GitHubToolsSubset.ISSUES_CONTRIBUTOR, character, {
        tools: [...schedulerTools],
        experienceConfig,
        monitoringConfig,
        characterDataPathConfig: {
          dataPath,
        },
        apiConfig,
      }),
    ]
    : [];

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [...githubAgentTools],
    prompts,
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
  // Choose which message to start with
  const initialMessage = `
- Check for new issues in the repository, and create a new issue if you encounter an error or have a suggestion.
- Check for new mentions and notifications, and react to them (with reactions or comments) if you have a suggestion.
- Check for new pull requests, and review or comment on them if you have a suggestion.
- Check for new comments on issues and pull requests, and respond to them if you have a suggestion.
- React to new pull request and comments with reactions if you have like or dislike.`;

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
