import { createNotionTools } from '@autonomys/agent-core/src/agents/tools/notion/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '@autonomys/agent-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '@autonomys/agent-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '@autonomys/agent-core/src/agents/workflows/orchestrator/types.js';
import { getConfig } from '@autonomys/agent-core/src/config/index.js';
import { createLogger } from '@autonomys/agent-core/src/utils/logger.js';
import { parseArgs } from '@autonomys/agent-core/src/utils/args.js';
import { createTaskQueue } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskQueue.js';
import { startTaskExecutor } from '@autonomys/agent-core/src/agents/workflows/orchestrator/scheduler/taskExecutor.js';
import { createApiServer, withApiLogger } from '@autonomys/agent-core/src/api/server.js';
import { createChatWorkflow } from '@autonomys/agent-core/src/agents/chat/workflow.js';
import { LLMConfiguration } from '@autonomys/agent-core/src/services/llm/types.js';
import { createDefaultChatTools } from '@autonomys/agent-core/src/agents/chat/tools.js';
import { createChatNodeConfig } from '@autonomys/agent-core/src/agents/chat/config.js';
import { registerOrchestratorRunner } from '@autonomys/agent-core/src/agents/workflows/registration.js';

// Process command line arguments for the Notion agent
parseArgs();

// Set up logging for our agent
const logger = createLogger('notion-agent');

// Load configuration from environment variables or config files
// This contains all the settings our agent needs to operate
const configInstance = await getConfig();
if (!configInstance) {
  throw new Error('Config instance not found');
}
const { config, characterName } = configInstance;
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
  const chatNodeConfig = createChatNodeConfig({ modelConfig, tools });
  const chatAppInstance = createChatWorkflow(chatNodeConfig);
  return chatAppInstance;
}

// Configure the orchestrator that will manage our agent's workflow
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  // Path to character data for agent personality and knowledge
  const dataPath = character.characterPath;
  
  // Retrieve and validate the Notion credentials from configuration
  // These tokens are required to authenticate with the Notion API
  const notionToken = config.notionConfig.NOTION_TOKEN;
  const notionDatabaseId = config.notionConfig.NOTION_DATABASE_ID;
  if (!notionToken) {
    throw new Error('NOTION_TOKEN is required in the environment variables');
  }
  if (!notionDatabaseId) {
    throw new Error('NOTION_DATABASE_ID is required in the environment variables');
  }
  
  // Create Notion tools that our agent can use
  // These tools allow the agent to interact with Notion databases and pages
  const notionTools = await createNotionTools(notionToken, notionDatabaseId);

  // Create prompts for the orchestrator, customized for our character
  const prompts = await createPrompts(character);

  // Return the complete orchestrator configuration
  return {
    tools: [...notionTools],
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
  // This provides a step-by-step workflow for the agent to follow
  // The agent will work with Notion databases and pages to create content
  const initialMessage = `
    First, list available Notion databases
    Then create a new database in Notion if there are none or if you need to create a new one to separate the project from other projects.
    Then create a new page in the database with some content or update a page with new content.
    Remember: The new page MUST be created in a parent database (you'll need the database ID).
    Finally, add a comment to the page.
    
    The goal is to write a Whitepaper for a new project.
  `;

  try {
    // Initialize the system components
    const logger = createLogger('app');
    logger.info('Initializing orchestrator runner...');
    const runner = await orchestratorRunner();

    // Create a task queue for managing agent tasks
    // This allows scheduling of tasks to be executed by the agent
    const taskQueue = createTaskQueue('orchestrator', config.characterConfig.characterPath);
    
    // Schedule our initial Notion task
    // The task will execute immediately when the executor starts
    taskQueue.scheduleTask(initialMessage, new Date());
    logger.info('Starting task executor...');
    const _startTaskExecutor = startTaskExecutor(runner, 'orchestrator');
    logger.info('Application initialized and ready to process scheduled tasks');
    
    // Keep the process running to handle tasks
    return new Promise(() => { });
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
