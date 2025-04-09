import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { Character } from '../../../config/characters.js';
import { TwitterApi } from '../../tools/twitter/types.js';
import { createAllTwitterTools } from '../../tools/twitter/index.js';
import { createOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createTwitterPrompts } from './prompts.js';
import { withApiLogger } from '../../../api/server.js';
import { createLogger } from '../../../utils/logger.js';
import { z } from 'zod';
import { TwitterAgentConfig, TwitterAgentOptions } from './types.js';
import { cleanTwitterMessageData } from './cleanMessages.js';
import { registerOrchestratorRunner } from '../../workflows/registration.js';
import {
  createApiConfig,
  createCharacterDataPathConfig,
  createExperienceConfig,
  createLLMConfig,
  createModelConfigurations,
  createMonitoringConfig,
  createPruningParameters,
} from '../orchestrator/config.js';

const logger = createLogger('twitter-workflow');

// Twitter-specific default configuration values
const defaultTwitterOptions = {
  maxThreadDepth: 5,
  postTweets: false,
  namespace: 'twitter',
};

/**
 * Creates a complete Twitter agent configuration by extending the orchestrator configuration
 */
const createTwitterAgentConfig = async (
  character: Character,
  twitterApi: TwitterApi,
  options?: TwitterAgentOptions,
): Promise<TwitterAgentConfig> => {
  // Create a base config with Twitter-specific fields
  const baseConfig = {
    namespace: options?.namespace ?? defaultTwitterOptions.namespace,
    recursionLimit: options?.recursionLimit ?? 100,
    postTweets: options?.postTweets ?? defaultTwitterOptions.postTweets,
    maxThreadDepth: options?.maxThreadDepth ?? defaultTwitterOptions.maxThreadDepth,
    logger: options?.logger,
  };

  const monitoringOptions = options?.monitoringConfig?.enabled
    ? {
        ...options.monitoringConfig,
        messageCleaner: cleanTwitterMessageData,
      }
    : undefined;

  // Reuse the orchestrator's configuration utilities
  const modelConfigurations = createModelConfigurations(options);
  const experienceConfig = createExperienceConfig(options);
  const monitoringConfig = createMonitoringConfig({
    ...options,
    monitoringConfig: monitoringOptions,
  });
  const pruningParameters = createPruningParameters(options);
  const characterDataPathConfig = createCharacterDataPathConfig(options);
  const apiConfig = createApiConfig(options);
  const llmConfig = createLLMConfig(options);
  // Get Twitter-specific tools and prompts
  const twitterTools = createAllTwitterTools(
    twitterApi,
    baseConfig.maxThreadDepth,
    baseConfig.postTweets,
  );

  const prompts = await createTwitterPrompts(character, twitterApi.username);

  // Combine all tools
  const tools = [...twitterTools, ...(options?.tools || [])];

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
  };
};

export const createTwitterAgent = (
  twitterApi: TwitterApi,
  character: Character,
  options?: TwitterAgentOptions,
) =>
  new DynamicStructuredTool({
    name: 'twitter_agent',
    description: `
    With this tool you can perform all necessary actions you would like to do on twitter.
    It is an agentic workflow that will execute many actions to meet your needs.
    Be specific about what you want to do.
    `,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const twitterAgentConfig = await createTwitterAgentConfig(character, twitterApi, options);
        const messages = [new HumanMessage(instructions)];
        const { namespace } = twitterAgentConfig;
        const runner = createOrchestratorRunner(character, {
          ...twitterAgentConfig,
          ...withApiLogger(
            character.name,
            twitterAgentConfig.characterDataPathConfig?.dataPath || process.cwd(),
            namespace,
            twitterAgentConfig.apiConfig.authFlag,
            twitterAgentConfig.apiConfig.authToken,
            twitterAgentConfig.apiConfig.port,
            twitterAgentConfig.apiConfig.allowedOrigins,
          ),
        });

        const runnerPromise = await runner;
        registerOrchestratorRunner(namespace, runnerPromise);
        const result = await runnerPromise.runWorkflow(
          { messages },
          { threadId: 'twitter_workflow_state' },
        );
        logger.info('Twitter workflow result:', { result });
        return {
          success: true,
          summary: result.summary,
        };
      } catch (error) {
        logger.error('Twitter workflow error:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
