// Export all core functionality
// Configuration
export * from './config/index.js';

// Agents and Tools
export { GitHubToolsSubset } from './agents/tools/github/index.js';
export { createAllSchedulerTools } from './agents/tools/scheduler/index.js';
export { createWebSearchTool } from './agents/tools/webSearch/index.js';
export { createFirecrawlTools } from './agents/tools/firecrawl/index.js';
export { createTwitterApi } from './agents/tools/twitter/client.js';
export { createNotionTools } from './agents/tools/notion-mcp/index.js';
export { createMcpClientTool } from './agents/tools/mcp-tool/index.js';

// Agent Workflows
export { createGithubAgent } from './agents/workflows/github/githubAgent.js';
export { createSlackAgent } from './agents/workflows/slack/slackAgent.js';
export { createTwitterAgent } from './agents/workflows/twitter/twitterAgent.js';
export {
  createOrchestratorRunner,
  type OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
export { createPrompts } from './agents/workflows/orchestrator/prompts.js';
export {
  type ModelConfigurations,
  type OrchestratorRunnerOptions,
} from './agents/workflows/orchestrator/types.js';
export { registerOrchestratorRunner } from './agents/workflows/registration.js';
export { startTaskExecutor } from './agents/workflows/orchestrator/scheduler/taskExecutor.js';

// API
export { createApiServer, type CreateApiServerParams, withApiLogger } from './api/server.js';

// Blockchain
export { createExperienceManager } from './blockchain/agentExperience/index.js';

// Services and Utils
export { type LLMConfiguration } from './services/llm/types.js';
export { closeAllVectorDBs } from './services/vectorDb/vectorDBPool.js';
export { createLogger } from './utils/logger.js';
export { parseArgs } from './utils/args.js';

// Setup signal handlers
import { createLogger } from './utils/logger.js';
import { closeAllVectorDBs } from './services/vectorDb/vectorDBPool.js';

const logger = createLogger('core');

// Export these for convenience
export const setupSignalHandlers = () => {
  process.on('SIGINT', () => {
    logger.info('Received SIGINT. Gracefully shutting down...');
    closeAllVectorDBs();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Gracefully shutting down...');
    closeAllVectorDBs();
    process.exit(0);
  });
};
