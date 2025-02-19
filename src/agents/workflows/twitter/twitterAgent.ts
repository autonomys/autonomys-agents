import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createTwitterPrompts } from './prompts.js';
import { createLogger } from '../../../utils/logger.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { HumanMessage } from '@langchain/core/messages';
import { LLMProvider } from '../../../services/llm/types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { ModelConfigurations, Tools } from '../orchestrator/types.js';
import { createAllTwitterTools } from '../../tools/twitter/index.js';
import { Character } from '../../../config/characters.js';

const logger = createLogger('twitter-workflow');

export type TwitterAgentOptions = {
  tools?: Tools;
  modelConfig?: ModelConfigurations;
  postTweets?: boolean;
  autoDriveUploadEnabled?: boolean;
};
const defaultModelConfig = {
  provider: LLMProvider.ANTHROPIC,
  model: 'claude-3-5-sonnet-latest',
  temperature: 1,
};
const defaultOptions = {
  tools: [],
  modelConfigurations: {
    inputModelConfig: defaultModelConfig,
    messageSummaryModelConfig: defaultModelConfig,
    finishWorkflowModelConfig: defaultModelConfig,
  },
  postTweets: false,
  autoDriveUploadEnabled: false,
};

const createTwitterAgentConfig = (options?: TwitterAgentOptions) => {
  return { ...defaultOptions, ...options };
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
        const { tools, modelConfigurations, postTweets, autoDriveUploadEnabled } =
          createTwitterAgentConfig(options);

        const messages = [new HumanMessage(instructions)];
        const namespace = 'twitter';

        const vectorStore = new VectorDB(namespace);
        const twitterTools = createAllTwitterTools(twitterApi, postTweets);
        const prompts = await createTwitterPrompts(character, twitterApi.username);
        const runner = await getOrchestratorRunner(character, {
          modelConfigurations,
          tools: [...twitterTools, ...tools],
          prompts,
          namespace,
          vectorStore,
          autoDriveUploadEnabled,
        });
        const result = await runner.runWorkflow(
          { messages },
          { threadId: 'twitter_workflow_state' },
        );
        logger.info('Twitter workflow result:', { result });
        return result;
      } catch (error) {
        logger.error('Twitter workflow error:', error);
        throw error;
      }
    },
  });
