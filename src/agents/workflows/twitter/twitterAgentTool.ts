import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createTwitterPrompts } from './prompts.js';
import { createTools } from './tools.js';
import { createLogger } from '../../../utils/logger.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { HumanMessage } from '@langchain/core/messages';

const logger = createLogger('twitter-workflow');

export const createTwitterAgentTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'twitter_workflow',
    description: `With this tool you can perform all necessary actions you would like to do on twitter. It is an agentic workflow that will execute many actions to meet your needs. Be specific about what you want to do.`,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const messages = [new HumanMessage(instructions)];
        const { tools } = createTools(twitterApi);
        const prompts = await createTwitterPrompts();
        const runner = await getOrchestratorRunner({ tools, prompts });
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
