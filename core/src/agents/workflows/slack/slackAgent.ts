import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { Character } from '../../../config/characters.js';
import { createOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createSlackTools } from '../../tools/slack/index.js';
import { createSlackPrompts } from './prompts.js';
import { withApiLogger } from '../../../api/server.js';
import { createLogger } from '../../../utils/logger.js';
import { z } from 'zod';
import { SlackAgentConfig, SlackAgentOptions } from './types.js';
import { registerOrchestratorRunner } from '../registration.js';
import {
  createExperienceConfig,
  createModelConfigurations,
  createMonitoringConfig,
  createPruningParameters,
  createCharacterDataPathConfig,
  createApiConfig,
} from '../orchestrator/config.js';

const logger = createLogger('slack-workflow');

// Slack-specific default configuration values
const defaultSlackOptions = {
  namespace: 'slack',
};

/**
 * Creates a complete Slack agent configuration by extending the orchestrator configuration
 */
const createSlackAgentConfig = async (
  slackToken: string,
  character: Character,
  options?: SlackAgentOptions,
): Promise<SlackAgentConfig> => {
  // Create a base config with Slack-specific fields
  const baseConfig = {
    namespace: options?.namespace ?? defaultSlackOptions.namespace,
    recursionLimit: options?.recursionLimit ?? 100,
    slackToken,
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
  // Get Slack-specific tools and prompts
  const slackTools = await createSlackTools(slackToken);
  const prompts = await createSlackPrompts(character);

  // Combine all tools
  const tools = [...slackTools, ...(options?.tools || [])];

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
  };
};

/**
 * Creates a Slack agent tool that can be used by other agents
 */
export const createSlackAgent = (
  slackToken: string,
  character: Character,
  options?: SlackAgentOptions,
) =>
  new DynamicStructuredTool({
    name: 'slack_agent',
    description: `
    With this tool you can perform all necessary actions you would like to do on slack.
    It is an agentic workflow that will execute many actions to meet your needs.
    Be specific about what you want to do.
    `,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const slackAgentConfig = await createSlackAgentConfig(slackToken, character, options);
        const messages = [new HumanMessage(instructions)];
        const { namespace } = slackAgentConfig;

        const runner = createOrchestratorRunner(character, {
          ...slackAgentConfig,
          ...withApiLogger(character.name, slackAgentConfig.characterDataPathConfig?.dataPath || process.cwd(), namespace, slackAgentConfig.apiConfig.authFlag, slackAgentConfig.apiConfig.authToken, slackAgentConfig.apiConfig.port, slackAgentConfig.apiConfig.allowedOrigins),
        });

        const runnerPromise = await runner;
        registerOrchestratorRunner(namespace, runnerPromise);
        const result = await runnerPromise.runWorkflow(
          { messages },
          { threadId: 'slack_workflow_state' },
        );
        logger.info('Slack workflow result:', { result });
        return result;
      } catch (error) {
        logger.error('Slack workflow error:', error);
        throw error;
      }
    },
  });
