import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  Block,
  ChatGetPermalinkResponse,
  ChatScheduleMessageResponse,
  ChatUpdateResponse,
  EmojiListResponse,
  PinsAddResponse,
  PinsListResponse,
  PinsRemoveResponse,
} from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('slack-tools');

/**
 * Creates a tool to list all pins in a Slack channel
 */
export const createListPinsTool = (getPins: (channelId: string) => Promise<PinsListResponse>) =>
  new DynamicStructuredTool({
    name: 'list_pins',
    description: `List all pinned items in a Slack channel.
    USE THIS WHEN:
    - You want to see what messages or items are pinned in a channel
    - You need to review important/pinned information in a channel`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to list pins from.'),
    }),
    func: async ({ channelId }) => {
      try {
        const result = await getPins(channelId);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error listing pins from Slack:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to pin a message in a Slack channel
 */
export const createAddPinTool = (
  addPin: (channelId: string, timestamp: string) => Promise<PinsAddResponse>,
) =>
  new DynamicStructuredTool({
    name: 'add_pin',
    description: `Pin a message in a Slack channel.
    USE THIS WHEN:
    - You want to highlight an important message for future reference
    - You need to save a message for easy access later`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the message is located.'),
      timestamp: z.string().describe('The timestamp of the message to pin.'),
    }),
    func: async ({ channelId, timestamp }) => {
      try {
        const result = await addPin(channelId, timestamp);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error pinning message in Slack:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to unpin a message in a Slack channel
 */
export const createRemovePinTool = (
  removePin: (channelId: string, timestamp: string) => Promise<PinsRemoveResponse>,
) =>
  new DynamicStructuredTool({
    name: 'remove_pin',
    description: `Remove a pin from a message in a Slack channel.
    USE THIS WHEN:
    - You want to unpin a message that's no longer relevant
    - You need to clean up pinned items in a channel`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the pinned message is located.'),
      timestamp: z.string().describe('The timestamp of the message to unpin.'),
    }),
    func: async ({ channelId, timestamp }) => {
      try {
        const result = await removePin(channelId, timestamp);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error removing pin in Slack:', error);
        throw error;
      }
    },
  });

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
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error listing emojis from Slack:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to edit an existing message in a Slack channel
 */
export const createEditMessageTool = (
  editMessage: (
    channelId: string,
    ts: string,
    text: string,
    blocks?: Block[],
  ) => Promise<ChatUpdateResponse>,
) =>
  new DynamicStructuredTool({
    name: 'edit_slack_msg',
    description: `Edit an existing message in a Slack channel.
    USE THIS WHEN:
    - You need to update or correct a previously sent message
    - You want to modify the content of an existing message
    - You need to update message blocks or text
    FORMAT: Provide the channel ID, message timestamp, and the new text/blocks to update the message.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the message is located.'),
      timestamp: z.string().describe('The timestamp of the message to edit.'),
      text: z.string().describe('The new text for the message.'),
      blocks: z
        .array(z.any())
        .optional()
        .describe('Optional: The new blocks for the message using Slack block-kit.'),
    }),
    func: async ({ channelId, timestamp, text, blocks }) => {
      try {
        logger.info('Editing message in Slack - Received data:', {
          channelId,
          timestamp,
          text,
          blocks,
        });
        const result = await editMessage(channelId, timestamp, text, blocks);
        logger.info('Message edited in Slack:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error editing message in Slack:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to schedule a message to be sent later in a Slack channel
 */
export const createScheduleMessageTool = (
  scheduleMessage: (
    channelId: string,
    text: string,
    postAt: number,
    blocks?: Block[],
    threadTs?: string,
  ) => Promise<ChatScheduleMessageResponse>,
) =>
  new DynamicStructuredTool({
    name: 'schedule_slack_msg',
    description: `Schedule a message to be sent later in a Slack channel.
    USE THIS WHEN:
    - You want to send a message at a specific time in the future
    - You need to schedule announcements or reminders
    - You want to time messages for different time zones
    FORMAT: Provide the channel ID, message text, and Unix timestamp for when to send the message.
    NOTE: The post_at time must be within 120 days from now, and cannot be in the past.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to post to.'),
      text: z.string().describe('The message text to schedule.'),
      postAt: z
        .number()
        .describe(
          'Unix timestamp of when message should be sent. Must be within 120 days and not in the past.',
        ),
      blocks: z
        .array(z.any())
        .optional()
        .describe('Optional: The blocks to post using Slack block-kit.'),
      threadTs: z
        .string()
        .optional()
        .describe('Optional: The thread timestamp to post to if this is a reply.'),
    }),
    func: async ({ channelId, text, postAt, blocks, threadTs }) => {
      try {
        logger.info('Scheduling message in Slack - Received data:', {
          channelId,
          text,
          postAt,
          blocks,
          threadTs,
        });
        const result = await scheduleMessage(channelId, text, postAt, blocks, threadTs);
        logger.info('Message scheduled in Slack:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error scheduling message in Slack:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get a permanent link to a specific message
 */
export const createGetPermalinkTool = (
  getPermalink: (channelId: string, messageTs: string) => Promise<ChatGetPermalinkResponse>,
) =>
  new DynamicStructuredTool({
    name: 'get_slack_permalink',
    description: `Get a permanent link to a specific Slack message.
    USE THIS WHEN:
    - You need to reference a specific message in another message
    - You want to share a message link on other platforms
    - You need to create a permanent reference to a conversation
    FORMAT: Provide the channel ID and message timestamp to get its permalink.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the message is located.'),
      messageTs: z.string().describe('The timestamp of the message to get the permalink for.'),
    }),
    func: async ({ channelId, messageTs }) => {
      try {
        logger.info('Getting permalink for Slack message:', {
          channelId,
          messageTs,
        });
        const result = await getPermalink(channelId, messageTs);
        logger.info('Got permalink for Slack message:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error getting permalink for Slack message:', error);
        throw error;
      }
    },
  });
