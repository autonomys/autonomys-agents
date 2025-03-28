import { DynamicStructuredTool } from '@langchain/core/tools';
import { EmojiListResponse, ReactionsAddResponse, ReactionsRemoveResponse } from '@slack/web-api';
import { ReactionsGetResponse } from '@slack/web-api/dist/types/response/ReactionsGetResponse.js';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('slack-tools');

/**
 * Creates a tool to list all custom emojis in a Slack workspace
 */
export const createListEmojisTool = (
  getEmojis: (includeCategories?: boolean) => Promise<EmojiListResponse>,
) =>
  new DynamicStructuredTool({
    name: 'list_emojis',
    description: `List all custom emojis available in the Slack workspace.
    USE THIS WHEN:
    - You want to see what custom emojis are available
    - You need to find specific emoji aliases
    - You want to check if certain custom emojis exist`,
    schema: z.object({
      includeCategories: z
        .boolean()
        .optional()
        .describe('Whether to include emoji categories in the response. Defaults to false.'),
    }),
    func: async ({ includeCategories = false }) => {
      try {
        const result = await getEmojis(includeCategories);
        return {
          success: true,
          emojis: {
            emoji: result.emoji,
            categories: result.categories,
          },
        };
      } catch (error) {
        logger.error('Error listing emojis from Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to get a reaction from a message in a Slack channel
 */
export const createGetReactionTool = (
  getReaction: (channelId: string, timestamp: string) => Promise<ReactionsGetResponse>,
) =>
  new DynamicStructuredTool({
    name: 'get_reaction',
    description: `Get all reactions from a message in a Slack channel.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to get the reaction from.'),
      timestamp: z.string().describe('The timestamp of the message to get the reaction from.'),
    }),
    func: async ({ channelId, timestamp }) => {
      try {
        const reactions = await getReaction(channelId, timestamp);
        return {
          success: true,
          reactions,
        };
      } catch (error) {
        logger.error('Error getting reaction from Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to add a reaction to a message in Slack
 */
export const createAddReactionTool = (
  addReaction: (
    channelId: string,
    timestamp: string,
    reaction: string,
  ) => Promise<ReactionsAddResponse>,
) =>
  new DynamicStructuredTool({
    name: 'add_reaction',
    description: `Add a reaction to a message in a Slack channel.
    USE THIS WHEN: 
    - You want to react to a message in a Slack channel.
    FORMAT: Choose a appropriate reaction from the list of reactions available in the Slack channel and that convey your emotion or reaction to the message.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to post to.'),
      timestamp: z.string().describe('The timestamp of the message to react to.'),
      reaction: z.string().describe('The reaction to add to the message.'),
    }),
    func: async ({ channelId, timestamp, reaction }) => {
      try {
        logger.info('Adding reaction to Slack - Received data:', {
          channelId,
          timestamp,
          reaction,
        });
        const result = await addReaction(channelId, timestamp, reaction);
        logger.info('Reaction added to Slack:', { result });
        return {
          success: true,
          reaction: result,
        };
      } catch (error) {
        logger.error('Error adding reaction to Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to remove a reaction from a message in Slack
 */
export const createRemoveReactionTool = (
  removeReaction: (
    channelId: string,
    timestamp: string,
    reaction: string,
  ) => Promise<ReactionsRemoveResponse>,
) =>
  new DynamicStructuredTool({
    name: 'remove_reaction',
    description: `Remove a reaction from a message in a Slack channel.
    USE THIS WHEN: 
    - You want to remove your reaction from a message in a Slack channel.
    - You need to undo a previously added reaction.
    FORMAT: Specify the reaction name that you want to remove from the message.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the message is located.'),
      timestamp: z.string().describe('The timestamp of the message to remove the reaction from.'),
      reaction: z.string().describe('The name of the reaction to remove from the message.'),
    }),
    func: async ({ channelId, timestamp, reaction }) => {
      try {
        logger.info('Removing reaction from Slack - Received data:', {
          channelId,
          timestamp,
          reaction,
        });
        const result = await removeReaction(channelId, timestamp, reaction);
        logger.info('Reaction removed from Slack:', { result });
        return {
          success: true,
          reaction: result,
        };
      } catch (error) {
        logger.error('Error removing reaction from Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
