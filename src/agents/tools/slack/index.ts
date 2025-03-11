import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  Block,
  ChatPostMessageResponse,
  EmojiListResponse,
  PinsAddResponse,
  PinsListResponse,
  PinsRemoveResponse,
  ReactionsAddResponse,
  UsersProfileGetResponse,
  UsersProfileSetArguments,
} from '@slack/web-api';
import { ReactionsGetResponse } from '@slack/web-api/dist/types/response/ReactionsGetResponse.js';
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
  ) => Promise<ChatPostMessageResponse>,
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

/**
 * Creates a tool to get user information from Slack
 */
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

/**
 * Creates a tool to get a user's profile from Slack
 */
export const createGetUserProfileTool = (
  getUserProfile: (userId: string) => Promise<UsersProfileGetResponse['profile']>,
) =>
  new DynamicStructuredTool({
    name: 'get_user_profile',
    description: `Get a user's complete profile information from Slack, including custom fields`,
    schema: z.object({
      userId: z.string().describe('The user ID to get profile information about.'),
    }),
    func: async ({ userId }) => {
      try {
        const profile = await getUserProfile(userId);
        return {
          success: true,
          profile: profile ?? 'Profile not found',
        };
      } catch (error) {
        logger.error('Error getting user profile:', error);
        return {
          success: false,
          error: error,
        };
      }
    },
  });

/**
 * Creates a tool to set a user's profile in Slack
 */
export const createSetUserProfileTool = (
  setUserProfile: (
    userId: string,
    profile: UsersProfileSetArguments['profile'],
  ) => Promise<boolean>,
) =>
  new DynamicStructuredTool({
    name: 'set_user_profile',
    description: `Set a user's profile information in Slack. Can update standard fields like status text and emoji, 
    or any custom profile fields configured for the workspace. Note: Requires users.profile:write scope and 
    appropriate admin permissions to modify other users' profiles.`,
    schema: z.object({
      userId: z.string().describe('The user ID whose profile to update.'),
      profile: z
        .object({
          display_name: z.string().optional().describe("User's display name"),
          email: z.string().optional().describe("User's email address"),
          first_name: z.string().optional().describe("User's first name"),
          last_name: z.string().optional().describe("User's last name"),
          phone: z.string().optional().describe("User's phone number"),
          pronouns: z.string().optional().describe("User's pronouns"),
          real_name: z.string().optional().describe("User's real name"),
          title: z.string().optional().describe("User's title"),
          status_emoji: z.string().optional().describe('The status emoji to set'),
          status_expiration: z
            .number()
            .optional()
            .describe('Status expiration time as a Unix timestamp'),
          status_text: z.string().optional().describe('The status text to set'),
        })
        .describe('Profile fields to update'),
    }),
    func: async ({ userId, profile }) => {
      try {
        const success = await setUserProfile(userId, profile);
        return {
          success,
          message: success ? 'Profile updated successfully' : 'Failed to update profile',
        };
      } catch (error) {
        logger.error('Error setting user profile:', error);
        return {
          success: false,
          error: error,
        };
      }
    },
  });

/**
 * Creates a tool to get a user's presence status from Slack
 */
export const createGetUserPresenceTool = (
  getUserPresence: (userId: string) => Promise<string | undefined>,
) =>
  new DynamicStructuredTool({
    name: 'get_user_presence',
    description: `Get a user's current presence status from Slack`,
    schema: z.object({
      userId: z.string().describe('The user ID to get presence status for.'),
    }),
    func: async ({ userId }) => {
      try {
        const presence = await getUserPresence(userId);
        return {
          success: true,
          presence: presence ?? 'Presence status not found',
        };
      } catch (error) {
        logger.error('Error getting user presence:', error);
        return {
          success: false,
          error: error,
        };
      }
    },
  });

/**
 * Creates a tool to set the user's presence in Slack
 */
export const createSetUserPresenceTool = (
  setUserPresence: (presence: 'auto' | 'away') => Promise<boolean>,
) =>
  new DynamicStructuredTool({
    name: 'set_user_presence',
    description: `Manually sets user presence in Slack. Note: Requires users:write scope.
    USE THIS WHEN:
    - You want to change the user's presence status
    - You need to set the user as away or auto (automatically determine presence based on user's activity)`,
    schema: z.object({
      presence: z
        .enum(['auto', 'away'])
        .describe('The presence state to set - either "auto" or "away"'),
    }),
    func: async ({ presence }) => {
      try {
        const success = await setUserPresence(presence);
        return {
          success,
          message: success ? `Presence set to ${presence} successfully` : 'Failed to set presence',
        };
      } catch (error) {
        logger.error('Error setting user presence:', error);
        return {
          success: false,
          error: error,
        };
      }
    },
  });

/**
 * Creates a tool to post a simple message to Slack
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
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error adding reaction to Slack:', error);
        throw error;
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
        const reaction = await getReaction(channelId, timestamp);
        return JSON.stringify(reaction);
      } catch (error) {
        logger.error('Error getting reaction from Slack:', error);
        throw error;
      }
    },
  });

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

export const createSlackTools = async (slackToken: string) => {
  const slack = await slackClient(slackToken);
  const postMessage = (channelId: string, message: string, blocks?: Block[], threadTs?: string) =>
    slack.postMessage({ channel: channelId, text: message, blocks, thread_ts: threadTs });
  const getUserChannels = () => slack.getUserChannels();
  const getUserInfo = (userId: string) => slack.getUserInfo(userId);
  const getUserProfile = (userId: string) => slack.getUserProfile(userId);
  const setUserProfile = (userId: string, profile: UsersProfileSetArguments['profile']) =>
    slack.setUserProfile(userId, profile);
  const getMessages = (channelId: string, limit: number) => slack.getMessages(channelId, limit);
  const addReaction = (channelId: string, timestamp: string, reaction: string) =>
    slack.addReaction(channelId, timestamp, reaction);
  const getReaction = (channelId: string, timestamp: string) =>
    slack.getReaction(channelId, timestamp);

  return [
    createPostSlackMsgTool(postMessage),
    createListChannelsTool(getUserChannels),
    createListMessagesTool(getMessages, slack.userId),
    createGetUserInfoTool(getUserInfo),
    createGetUserProfileTool(getUserProfile),
    createSetUserProfileTool(setUserProfile),
    createGetUserPresenceTool(slack.getUserPresence),
    createSetUserPresenceTool(slack.setUserPresence),
    createAddReactionTool(addReaction),
    createGetReactionTool(getReaction),
    createListPinsTool(slack.getPins),
    createAddPinTool(slack.addPin),
    createRemovePinTool(slack.removePin),
    createListEmojisTool(slack.getEmojis),
  ];
};
