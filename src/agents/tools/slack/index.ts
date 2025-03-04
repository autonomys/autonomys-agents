import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { postSlackMsg } from './utils/utils.js';

const logger = createLogger('post-slack-msg-tool');

export const createPostSlackMsgTool = () =>
  new DynamicStructuredTool({
    name: 'post_slack_msg',
    description: `Post a message to Slack in the conversation ID specified in the environment variables.
    USE THIS WHEN: 
    - You want to report or highlight something privately to your colleagues.
    FORMAT: Include links, messages, and any other relevant information. Avoid very long messages.`,
    schema: z.object({
      message: z.string(),
    }),
    func: async ({ message }) => {
      try {
        logger.info('Posting message to Slack - Received data:', message);
        const post = await postSlackMsg(message);
        return post;
      } catch (error) {
        logger.error('Error posting message to Slack:', error);
        throw error;
      }
    },
  });
