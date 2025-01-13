import { AIMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { postSlackMsg } from './utils/slack.js';

const logger = createLogger('post-slack-msg-tool');

export const createPostSlackMsgTool = () =>
  new DynamicStructuredTool({
    name: 'post_slack_msg',
    description: 'Post a message to Slack',
    schema: z.object({
      message: z.string(),
    }),
    func: async ({ message }) => {
      try {
        logger.info('Posting message to Slack - Received data:', JSON.stringify(message, null, 2));
        const post = await postSlackMsg(message);
        logger.info('Posting message to Slack - Post info:', JSON.stringify(post, null, 2));
        return post;
      } catch (error) {
        logger.error('Error posting message to Slack:', error);
        throw error;
      }
    },
  });

export const invokePostSlackMsgTool = async (toolNode: ToolNode, message: string) => {
  logger.info('Invoking post message to Slack tool with data:', JSON.stringify(message, null, 2));
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'post_slack_msg',
            args: { message },
            id: 'post_slack_msg_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
