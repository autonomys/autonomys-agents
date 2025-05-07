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
import { createPromptTemplate } from '@autonomys/agent-core/src/agents/chat/nodes/prompt.js';
// Process command line arguments for the GitHub agent
parseArgs();

// Set up logging for our agent
const logger = createLogger('autonomous-web3-agent');

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

// Set up the chat application instance
// This provides conversational capabilities to our agent
const chatAppInstance = async (): Promise<any> => {
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
            agentName: character.name,
            agentPath: character.characterPath,
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

  // Retrieve and validate the GitHub token from configuration
  // This token is required to authenticate with the GitHub API
  const githubToken = config.githubConfig.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required in the environment variables');
  }

  // Create GitHub agent tools if the token is available
  // These tools allow the agent to interact with GitHub repositories
  // The ISSUES_CONTRIBUTOR subset provides tools for working with issues and PRs
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

  // Create prompts for the orchestrator, customized for our character
  const prompts = await createPrompts(character);

  // Return the complete orchestrator configuration
  return {
    tools: [...githubAgentTools],
    prompts,
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
    chatAppInstance: await chatAppInstance(),
  });

  // Define the initial task for our agent to perform
  // This provides a comprehensive workflow for monitoring GitHub activity
  // The agent will check issues, PRs, and comments, and respond appropriately
  const initialMessage = `
- Check for new issues in the repository, and create a new issue if you encounter an error or have a suggestion.
- Check for new mentions and notifications, and react to them (with reactions or comments) if you have a suggestion.
- Check for new pull requests, and review or comment on them if you have a suggestion.
- Check for new comments on issues and pull requests, and respond to them if you have a suggestion.
- React to new pull request and comments with reactions if you have like or dislike.`;

  try {
    // Initialize the system components
    const logger = createLogger('app');
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    // Create a task queue for managing agent tasks
    // This allows scheduling of tasks to be executed by the agent
    const taskQueue = createTaskQueue('orchestrator', config.characterConfig.characterPath);

    // Schedule our initial GitHub monitoring task
    // The task will execute immediately when the executor starts
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
