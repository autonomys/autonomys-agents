import { DynamicStructuredTool } from '@langchain/core/tools';
import { UsersProfileGetResponse, UsersProfileSetArguments } from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { UserInfo } from './client.js';

const logger = createLogger('slack-tools');

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
