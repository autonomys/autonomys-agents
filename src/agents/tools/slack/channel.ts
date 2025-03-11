import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import type { ChannelInfo } from './utils/types.js';

const logger = createLogger('slack-tools');

/**
 * Creates a tool to list all channels the bot has access to
 */
export const createListChannelsTool = (getUserChannels: () => Promise<ChannelInfo[]>) =>
  new DynamicStructuredTool({
    name: 'list_slack_channels',
    description: `List all Slack channels the bot has access to.
    USE THIS WHEN: 
    - You need to find channel IDs
    - You want to see what channels are available`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing Slack channels');
        const channels = await getUserChannels();
        return {
          success: true,
          channels,
        };
      } catch (error) {
        logger.error('Error listing Slack channels:', error);
        throw error;
      }
    },
  });
