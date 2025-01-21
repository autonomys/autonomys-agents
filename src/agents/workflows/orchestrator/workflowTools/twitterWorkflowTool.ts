import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { getWorkflowRunner } from '../../twitter/workflow.js';

const logger = createLogger('twitter-workflow-tool');

export const createTwitterWorkflowTool = () =>
  new DynamicStructuredTool({
    name: 'twitter_workflow',
    description:
      'Workflow to check twitter for mentions, replies and trends, to respond to tweets and mentions and to post tweets',
    schema: z.object({ characterFile: z.string() }),
    func: async ({ characterFile }: { characterFile: string }) => {
      try {
        const runner = await getWorkflowRunner(characterFile);
        const result = await runner.runWorkflow();
        return result;
      } catch (error) {
        logger.error('Twitter workflow error:', error);
        throw error;
      }
    },
  });

export const invokeTwitterWorkflow = async (toolNode: ToolNode, characterFile: string) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'twitter_workflow',
            args: { characterFile },
            id: 'twitter_workflow_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
