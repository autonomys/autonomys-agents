import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createPrompts } from './prompts.js';
import { createTools } from './tools.js';
import { createLogger } from '../../../utils/logger.js';
import { TwitterApi } from '../../../services/twitter/types.js';

const logger = createLogger('twitter-workflow');

export const createTwitterAgentTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'twitter_workflow',
    description:
      'Workflow to check twitter for mentions, replies and trends, to respond to tweets and mentions and to post tweets',
    schema: z.object({}),
    func: async () => {
      try {
        const { tools } = createTools(twitterApi);
        const prompts = await createPrompts();
        const runner = await getOrchestratorRunner({ tools, prompts });
        const result = await runner.runWorkflow();
        return result;
      } catch (error) {
        logger.error('Twitter workflow error:', error);
        throw error;
      }
    },
  });
