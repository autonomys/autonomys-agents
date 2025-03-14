import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { Character } from '../../../config/characters.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { createAllTwitterTools } from '../../tools/twitter/index.js';
import { createOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createTwitterPrompts } from './prompts.js';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { withApiLogger } from '../../../api/server.js';
import { createLogger } from '../../../utils/logger.js';
import { z } from 'zod';
import { TwitterAgentConfig, TwitterAgentOptions } from './types.js';
import { cleanTwitterMessageData } from './cleanMessages.js';
import { registerOrchestratorRunner } from '../../workflows/registration.js';

const logger = createLogger('twitter-workflow');

const defaultModelConfig: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-latest',
  temperature: 0.8,
};

const defaultOptions: TwitterAgentConfig = {
  tools: [],
  modelConfigurations: {
    inputModelConfig: defaultModelConfig,
    messageSummaryModelConfig: defaultModelConfig,
    finishWorkflowModelConfig: defaultModelConfig,
  },
  maxThreadDepth: 5,
  postTweets: false,
  saveExperiences: false,
  monitoring: {
    enabled: false,
    messageCleaner: cleanTwitterMessageData,
  },
  recursionLimit: 100,
};

const createTwitterAgentConfig = (options?: TwitterAgentOptions): TwitterAgentConfig => {
  const modelConfigurations = {
    ...defaultOptions.modelConfigurations,
    ...options?.modelConfigurations,
  };
  const monitoring = {
    ...defaultOptions.monitoring,
    ...options?.monitoring,
  };

  return { ...defaultOptions, ...options, modelConfigurations, monitoring };
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
        const {
          tools,
          modelConfigurations,
          postTweets,
          maxThreadDepth,
          saveExperiences,
          monitoring,
          recursionLimit,
        } = createTwitterAgentConfig(options);
        const messages = [new HumanMessage(instructions)];
        const namespace = 'twitter';

        const twitterTools = createAllTwitterTools(twitterApi, maxThreadDepth, postTweets);
        const prompts = await createTwitterPrompts(character, twitterApi.username);

        const runner = createOrchestratorRunner(character, {
          modelConfigurations,
          tools: [...twitterTools, ...tools],
          prompts,
          namespace,
          saveExperiences,
          monitoring,
          recursionLimit,
          ...withApiLogger(namespace),
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
