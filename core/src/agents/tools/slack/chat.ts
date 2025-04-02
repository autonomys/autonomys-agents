import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  Block,
  ChatGetPermalinkResponse,
  ChatPostMessageResponse,
  ChatScheduleMessageResponse,
  ChatUpdateResponse,
} from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import type { MessageInfo } from './utils/types.js';

const logger = createLogger('slack-tools');

/**
 * Creates a tool to post a simple message to Slack
 */
export const createPostSlackMsgTool = (
  postMessage: (
    channelId: string,
    message: string,
    blocks?: Block[],
    threadTs?: string,
  ) => Promise<ChatPostMessageResponse>,
) =>
  new DynamicStructuredTool({
    name: 'post_slack_msg',
    description: `Post a message to a Slack channel or reply to a message in a thread.
    USE THIS WHEN: 
    - You want to report or highlight something to your colleagues.
    - You need to send a message to a specific channel.
    FORMAT: Include links, messages, and any other relevant information. Avoid very long messages.
    BEFORE POSTING:
    - use the list_slack_messages tool to check if a similar message has already been posted. If it has, do not post the same message again.
    - After reviewing the list of messages, determine if the message would be best suited as a thread or a new message.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to post to.'),
      message: z.string().describe('The message to post to Slack'),
      blocks: z
        .any()
        .optional()
        .describe('The blocks to post to Slack using Slack block-kit (optional)'),
      threadTs: z.string().describe('The thread timestamp to post to if this is a reply.'),
    }),
    func: async ({ message, channelId, blocks, threadTs }) => {
      try {
        logger.info('Posting message to Slack - Received data:', message);
        const result = await postMessage(channelId, message, blocks, threadTs);
        logger.info('Message posted to Slack:', { result });
        return {
          success: true,
          message: result,
        };
      } catch (error) {
        logger.error('Error posting message to Slack:', error);
        return {
          success: false,
          error: error,
        };
      }
    },
  });

/**
 * Creates a tool to list recent messages in a Slack channel
 */
export const createListMessagesTool = (
  getMessages: (channelId: string, limit: number) => Promise<MessageInfo[]>,
  agentUserId: string,
) =>
  new DynamicStructuredTool({
    name: 'list_slack_messages',
    description: `List recent messages in a Slack channel.
        USE THIS WHEN: 
        - You need to see the latest messages in a channel
        - You want to see what's been posted recently`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to list messages from.'),
      limit: z.number().describe('The number of messages to list. Default is 10.'),
    }),
    func: async ({ channelId, limit = 10 }) => {
      try {
        logger.info('Listing Slack messages');
        const messages = await getMessages(channelId, limit);
        return {
          success: true,
          messages,
          agentUserId,
        };
      } catch (error) {
        logger.error('Error listing Slack messages:', error);
        return {
          success: false,
          error: error,
        };
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
    - You want to add or remove blocks from the message
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
        return {
          success: true,
          message: result,
        };
      } catch (error) {
        logger.error('Error editing message in Slack:', error);
        return {
          success: false,
          error,
        };
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
    - You don't want to annoy your colleagues with messages at the wrong time (out of office hours)
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
        return {
          success: true,
          message: result,
        };
      } catch (error) {
        logger.error('Error scheduling message in Slack:', error);
        return {
          success: false,
          error,
        };
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
        return {
          success: true,
          permalink: result.permalink,
        };
      } catch (error) {
        logger.error('Error getting permalink for Slack message:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
