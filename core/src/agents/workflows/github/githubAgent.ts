import { HumanMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { withApiLogger } from '../../../api/server.js';
import { Character } from '../../../config/types.js';
import { createLogger } from '../../../utils/logger.js';
import { createGitHubTools, GitHubToolsSubset } from '../../tools/github/index.js';
import { createOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { registerOrchestratorRunner } from '../registration.js';
import { createGithubPrompts } from './prompts.js';
import { GithubAgentConfig, GithubAgentOptions } from './types.js';
import {
  createApiConfig,
  createCharacterDataPathConfig,
  createExperienceConfig,
  createLLMConfig,
  createModelConfigurations,
  createMonitoringConfig,
  createPruningParameters,
  createStopCounterLimit,
} from '../orchestrator/config.js';
const logger = createLogger('github-workflow');

// GitHub-specific default configuration values
const defaultGithubOptions = {
  namespace: 'github',
};

/**
 * Creates a complete GitHub agent configuration by extending the orchestrator configuration
 */
const createGithubAgentConfig = async (
  githubToken: string,
  toolsSubset: GitHubToolsSubset,
  character: Character,
  options?: GithubAgentOptions,
): Promise<GithubAgentConfig> => {
  // Create a base config with GitHub-specific fields
  const baseConfig = {
    namespace: options?.namespace ?? defaultGithubOptions.namespace,
    recursionLimit: options?.recursionLimit ?? 100,
    githubToken,
    toolsSubset,
    logger: options?.logger,
  };

  // Reuse the orchestrator's configuration utilities
  const modelConfigurations = createModelConfigurations(options);
  const experienceConfig = createExperienceConfig(options);

  // Create a monitoring config without custom message cleaner
  const monitoringConfig = createMonitoringConfig(options);

  const pruningParameters = createPruningParameters(options);
  const characterDataPathConfig = createCharacterDataPathConfig(options);
  const apiConfig = createApiConfig(options);
  const llmConfig = createLLMConfig(options);
  // Get GitHub-specific tools and prompts
  const githubTools = await createGitHubTools(githubToken, toolsSubset);
  const prompts = await createGithubPrompts(character);
  const stopCounterLimit = createStopCounterLimit(options);
  // Combine all tools
  const tools = [...githubTools, ...(options?.tools || [])];

  // Return the complete configuration
  return {
    characterName: character.name,
    ...baseConfig,
    modelConfigurations,
    tools,
    prompts,
    pruningParameters,
    experienceConfig,
    monitoringConfig,
    characterDataPathConfig,
    apiConfig,
    llmConfig,
    stopCounterLimit,
  };
};

/**
 * Creates a GitHub agent tool that can be used by other agents
 */
export const createGithubAgent = (
  githubToken: string,
  subset: GitHubToolsSubset,
  character: Character,
  options?: GithubAgentOptions,
) =>
  new DynamicStructuredTool({
    name: 'github_agent',
    description: `
    With this tool you can perform all necessary actions you would like to do on github.
    It is an agentic workflow that will execute many actions to meet your needs.
    Be specific about what you want to do.
    `,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const githubAgentConfig = await createGithubAgentConfig(
          githubToken,
          subset,
          character,
          options,
        );
        const messages = [new HumanMessage(instructions)];
        const { namespace } = githubAgentConfig;

        const runner = createOrchestratorRunner(character, {
          ...githubAgentConfig,
          ...withApiLogger(namespace, githubAgentConfig.apiConfig ? true : false),
        });

        const runnerPromise = await runner;
        registerOrchestratorRunner(namespace, runnerPromise);
        const result = await runnerPromise.runWorkflow(
          { messages },
          { threadId: 'github_workflow_state' },
        );
        logger.info('Github workflow result:', { result });
        return result;
      } catch (error) {
        logger.error('Github workflow error:', error);
        throw error;
      }
    },
  });
