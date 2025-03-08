import { DynamicStructuredTool } from '@langchain/core/tools';
import { Block } from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { ChannelInfo, MessageInfo, slackClient, UserInfo } from './client.js';

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
  ) => Promise<{ success: boolean; channel: string; message: string; ts: string }>,
) =>
  new DynamicStructuredTool({
    name: 'post_slack_msg',
    description: `Post a message to a Slack channel or reply to a message in a thread.
    USE THIS WHEN: 
    - You want to report or highlight something to your colleagues.
    FORMAT: Include links, messages, and any other relevant information. Avoid very long messages.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to post to.'),
      message: z.string().describe('The message to post to Slack'),
      blocks: z
        .array(z.any())
        .describe('The blocks to post to Slack using Slack block-kit (optional)'),
      threadTs: z.string().describe('The thread timestamp to post to if this is a reply.'),
    }),
    func: async ({ message, channelId, blocks, threadTs }) => {
      try {
        logger.info('Posting message to Slack - Received data:', message);
        const result = await postMessage(channelId, message, blocks, threadTs);
        logger.info('Message posted to Slack:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error posting message to Slack:', error);
        throw error;
      }
    },
  });

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

export const createGetUserInfoTool = (
  getUserInfo: (userId: string) => Promise<UserInfo | undefined>,
) =>
  new DynamicStructuredTool({
    name: 'get_user_info',
    description: `Get information about a user in Slack`,
    schema: z.object({ userId: z.string().describe('The user ID to get information about.') }),
    func: async ({ userId }) => {
      try {
        const userInfo = await getUserInfo(userId);
        return {
          success: true,
          userInfo: userInfo ?? 'User not found',
        };
      } catch (error) {
        logger.error('Error getting user info:', error);
        return {
          success: false,
          error: error,
        };
      }
    },
  });

export const createSlackTools = async (slackToken: string) => {
  const slack = await slackClient(slackToken);
  const postMessage = (channelId: string, message: string, blocks?: Block[], threadTs?: string) =>
    slack.postMessage({ channel: channelId, text: message, blocks, thread_ts: threadTs });
  const getUserChannels = () => slack.getUserChannels();
  const getMessages = (channelId: string, limit: number) => slack.getMessages(channelId, limit);
  const getUserInfo = (userId: string) => slack.getUserInfo(userId);

  return [
    createPostSlackMsgTool(postMessage),
    createListChannelsTool(getUserChannels),
    createListMessagesTool(getMessages, slack.userId),
    createGetUserInfoTool(getUserInfo),
  ];
};
