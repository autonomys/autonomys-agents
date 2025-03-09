import { DynamicStructuredTool } from '@langchain/core/tools';
import { Client } from 'discord.js';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import discordClient, { ChannelInfo, MessageInfo, ServerInfo } from './client.js';

const logger = createLogger('discord-tools');

const createListServersTool = (getServers: () => Promise<ServerInfo[]>) =>
  new DynamicStructuredTool({
    name: 'discord_list_servers',
    description: 'List all Discord servers (guilds) that the bot has access to',
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing Discord servers');
        const servers = await getServers();
        return {
          success: true,
          servers,
        };
      } catch (error) {
        logger.error('Error listing Discord servers:', error);
        throw error;
      }
    },
  });

const createListChannelsTool = (getChannels: (serverId: string) => Promise<ChannelInfo[]>) =>
  new DynamicStructuredTool({
    name: 'discord_list_channels',
    description: 'List all channels in a specific Discord server',
    schema: z.object({
      serverId: z.string().describe('The server ID to list channels from'),
    }),
    func: async ({ serverId }) => {
      try {
        logger.info('Listing Discord channels');
        const channels = await getChannels(serverId);
        return {
          success: true,
          channels,
        };
      } catch (error) {
        logger.error('Error listing Discord channels:', error);
        throw error;
      }
    },
  });

const createGetMessagesTool = (
  getMessages: (channelId: string, limit: number) => Promise<MessageInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'discord_get_messages',
    description: 'Get recent messages from a specific channel',
    schema: z.object({
      channelId: z.string().describe('The channel ID to get messages from'),
      limit: z.number().describe('The number of messages to retrieve. Default is 10.'),
    }),
    func: async ({ channelId, limit = 10 }) => {
      try {
        logger.info('Getting Discord messages');
        const messages = await getMessages(channelId, limit);
        return {
          success: true,
          messages,
        };
      } catch (error) {
        logger.error('Error getting Discord messages:', error);
        throw error;
      }
    },
  });

const createPostMessageTool = (
  postMessage: (
    channelId: string,
    content: string,
  ) => Promise<{ success: boolean; channel: string; message: string }>,
) =>
  new DynamicStructuredTool({
    name: 'discord_post_message',
    description: 'Post a new message to a specific channel',
    schema: z.object({
      channelId: z.string().describe('The channel ID to post to'),
      content: z.string().describe('The message content to post'),
    }),
    func: async ({ channelId, content }) => {
      try {
        logger.info('Posting Discord message');
        const result = await postMessage(channelId, content);
        return result;
      } catch (error) {
        logger.error('Error posting Discord message:', error);
        throw error;
      }
    },
  });

const createReplyToMessageTool = (
  replyToMessage: (
    channelId: string,
    messageId: string,
    content: string,
  ) => Promise<{
    success: boolean;
    channel: string;
    message: string;
    messageId: string;
    replyTo: string;
  }>,
) =>
  new DynamicStructuredTool({
    name: 'discord_reply_to_message',
    description: 'Reply to a specific message in a channel',
    schema: z.object({
      channelId: z.string().describe('The channel ID where the message is'),
      messageId: z.string().describe('The ID of the message to reply to'),
      content: z.string().describe('The reply content'),
    }),
    func: async ({ channelId, messageId, content }) => {
      try {
        logger.info('Replying to Discord message');
        const result = await replyToMessage(channelId, messageId, content);
        return result;
      } catch (error) {
        logger.error('Error replying to Discord message:', error);
        throw error;
      }
    },
  });

const createAddReactionTool = (
  addReaction: (
    channelId: string,
    messageId: string,
    reaction: string,
  ) => Promise<{ success: boolean; channel: string }>,
) =>
  new DynamicStructuredTool({
    name: 'discord_add_reaction',
    description: 'Add a reaction to a specific message',
    schema: z.object({
      channelId: z.string().describe('The channel ID where the message is'),
      messageId: z.string().describe('The ID of the message to react to'),
      reaction: z.string().describe('The reaction emoji to add'),
    }),
    func: async ({ channelId, messageId, reaction }) => {
      try {
        logger.info('Adding Discord reaction');
        const result = await addReaction(channelId, messageId, reaction);
        return result;
      } catch (error) {
        logger.error('Error adding Discord reaction:', error);
        throw error;
      }
    },
  });

export const createDiscordTools = async (token: string) => {
  const discord = await discordClient(token);

  return [
    createListServersTool(() => discord.getServers()),
    createListChannelsTool(serverId => discord.getChannels(serverId)),
    createGetMessagesTool((channelId, limit) => discord.getMessages(channelId, limit)),
    createPostMessageTool((channelId, content) => discord.postMessage(channelId, content)),
    createReplyToMessageTool((channelId, messageId, content) =>
      discord.replyToMessage(channelId, messageId, content),
    ),
    createAddReactionTool((channelId, messageId, reaction) =>
      discord.addReaction(channelId, messageId, reaction),
    ),
  ];
};
