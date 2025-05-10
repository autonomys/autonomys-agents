import { createWebSearchTool } from '@autonomys/agent-core/src/agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '@autonomys/agent-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '@autonomys/agent-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '@autonomys/agent-core/src/agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from '@autonomys/agent-core/src/agents/workflows/twitter/twitterAgent.js';
import { getConfig } from '@autonomys/agent-core/src/config/index.js';
import { Character } from '@autonomys/agent-core/src/config/types.js';
import { createTwitterApi } from '@autonomys/agent-core/src/agents/tools/twitter/client.js';
import { createLogger } from '@autonomys/agent-core/src/utils/logger.js';
import { createAllSchedulerTools } from '@autonomys/agent-core/src/agents/tools/scheduler/index.js';
import { createExperienceManager } from '@autonomys/agent-core/src/blockchain/agentExperience/index.js';
import { parseArgs } from '@autonomys/agent-core/src/utils/args.js';
import { createChatWorkflow } from '@autonomys/agent-core/src/agents/chat/workflow.js';
import { createDefaultChatTools } from '@autonomys/agent-core/src/agents/chat/tools.js';
import { createChatNodeConfig } from '@autonomys/agent-core/src/agents/chat/config.js';
import { LLMConfiguration } from '@autonomys/agent-core/src/services/llm/types.js';
import { registerOrchestratorRunner } from '@autonomys/agent-core/src/agents/workflows/registration.js';
import { createApiServer, withApiLogger } from '@autonomys/agent-core/src/api/server.js';
import { startTaskExecutor } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskExecutor.js';
import { createTaskQueue } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskQueue.js';
import { createPromptTemplate } from '@autonomys/agent-core/src/agents/chat/nodes/prompt.js';
import { ChatWorkflow } from '@autonomys/agent-core/src/agents/chat/types.js';
// Process command line arguments for our multi-personality agent
parseArgs();

// Set up logging for our Twitter agent system
const logger = createLogger('autonomous-twitter-agent');

// Load configuration from environment variables or config files
// This contains all the settings our agent needs to operate
const configInstance = await getConfig();
if (!configInstance) {
  throw new Error('Config instance not found');
}
const { config, agentVersion, characterName } = configInstance;
const character = config.characterConfig;

// Define API configuration for exposing agent functionality via REST API
// This allows external applications to interact with our agent
const apiConfig = {
  apiEnabled: config.ENABLE_API,
  authFlag: config.apiSecurityConfig.ENABLE_AUTH,
  authToken: config.apiSecurityConfig.API_TOKEN ?? '',
  port: config.API_PORT,
  allowedOrigins: config.apiSecurityConfig.CORS_ALLOWED_ORIGINS,
};

// The Twitter character will be the provided character from config
// This personality handles the Twitter-specific interactions
const twitterCharacter = config.characterConfig;

// Create a second character for the orchestrator
// This personality coordinates the overall workflow and keeps things on track
const orchestratorCharacter: Character = {
  name: 'Responsible Agent',
  characterPath: twitterCharacter.characterPath,
  goal: 'Schedule and execute workflows, making sure to keep any sub-agents on track',
  personality: ['Responsible', 'Persuasive', 'Organized'],
  expertise: ['Workflow scheduling', 'Task prioritization', 'Error handling'],
  communicationRules: {
    rules: [],
    wordsToAvoid: [],
  },
};

// Set up the chat application instance
// This provides conversational capabilities to our agent
const chatAppInstance = (): ChatWorkflow => {
  // Configure a lightweight model for chat interactions
  const modelConfig: LLMConfiguration = {
    model: 'claude-3-5-haiku-latest',
    provider: 'anthropic',
    temperature: 0.5,
  };
  const tools = createDefaultChatTools(config.characterConfig.characterPath);
  const promptTemplate = createPromptTemplate(characterName);
  const chatNodeConfig = createChatNodeConfig({ modelConfig, tools, promptTemplate });
  const chatAppInstance = createChatWorkflow(chatNodeConfig);
  return chatAppInstance;
};

// Configure the orchestrator that will manage our agent's workflow
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  // Path to character data for agent personality and knowledge
  const dataPath = character.characterPath;

  // Create web search capability if API key is available
  // This allows our agent to search the web for information
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];

  // Configure experience saving and monitoring features
  // These track the agent's activities and save them to blockchain
  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;

  // Create tools for scheduling tasks
  // These allow the agent to plan and execute activities over time
  const schedulerTools = createAllSchedulerTools();

  // Set up experience management if all required configuration is available
  // This connects to blockchain for storing agent experiences
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
            agentName: orchestratorCharacter.name,
            agentPath: orchestratorCharacter.characterPath,
          },
        })
      : undefined;

  // Configure experience saving based on available components
  const experienceConfig =
    saveExperiences && experienceManager
      ? {
          saveExperiences: true as const,
          experienceManager,
        }
      : {
          saveExperiences: false as const,
        };

  // Configure monitoring based on available components
  const monitoringConfig =
    monitoringEnabled && experienceManager
      ? {
          enabled: true as const,
          monitoringExperienceManager: experienceManager,
        }
      : {
          enabled: false as const,
        };

  // Create Twitter agent tool if credentials are available
  // This tool uses the Twitter character personality
  const twitterAgentTool =
    config.twitterConfig.USERNAME && config.twitterConfig.PASSWORD
      ? [
          createTwitterAgent(
            await createTwitterApi(
              config.twitterConfig.USERNAME,
              config.twitterConfig.PASSWORD,
              config.twitterConfig.COOKIES_PATH,
            ),
            twitterCharacter,
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
            },
          ),
        ]
      : [];

  // Create orchestrator prompts customized for our orchestrator character
  // This is what makes the orchestrator use its own distinct personality
  const prompts = await createPrompts(orchestratorCharacter);

  // Configure advanced models for summary and workflow completion
  // These more powerful models help with complex reasoning tasks
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

  // Return the complete orchestrator configuration
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

// Initialize the orchestrator configuration
const orchestrationConfig = await orchestratorConfig();

// Create a reusable orchestrator runner
// This singleton pattern ensures we only create one runner instance
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      const namespace = 'orchestrator';
      runnerPromise = createOrchestratorRunner(config.characterConfig, {
        ...orchestrationConfig,
        ...withApiLogger(namespace, orchestrationConfig.apiConfig ? true : false),
      });
      const runner = await runnerPromise;
      registerOrchestratorRunner(namespace, runner);
    }
    return runnerPromise;
  };
})();

// Main application entry point
const main = async () => {
  // Set up the API server to allow external interaction with our agent
  const _createApiServer = createApiServer({
    characterName: characterName,
    dataPath: config.characterConfig.characterPath,
    authFlag: config.apiSecurityConfig.ENABLE_AUTH,
    authToken: config.apiSecurityConfig.API_TOKEN ?? '',
    apiPort: config.API_PORT,
    allowedOrigins: config.apiSecurityConfig.CORS_ALLOWED_ORIGINS,
    chatAppInstance: chatAppInstance(),
  });

  const initialMessage = `Check your timeline, engage with posts and find an interesting topic to tweet about.`;
  try {
    // Initialize the system components
    const logger = createLogger('app');
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    // Create a task queue for managing agent tasks
    // This allows scheduling of tasks to be executed by the agent
    const taskQueue = createTaskQueue('orchestrator', config.characterConfig.characterPath);

    // Schedule our initial multi-personality task
    // The orchestrator will handle it and delegate to the Twitter agent as needed
    taskQueue.scheduleTask(initialMessage, new Date());
    logger.info('Starting task executor...');
    const _startTaskExecutor = startTaskExecutor(runner, 'orchestrator');
    logger.info('Application initialized and ready to process scheduled tasks');

    // Keep the process running to handle tasks
    return new Promise(() => {});
  } catch (error) {
    // Handle exit requests gracefully
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
      logger.info('Process terminated by user');
      process.exit(0);
    }

    // Log other errors and exit with failure code
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

// Set up signal handlers for graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Start the application
main();
