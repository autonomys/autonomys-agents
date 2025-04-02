import type {
  UsersProfileSetArguments,
  UsersSetPresenceArguments,
  WebClient,
} from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';
import type { User, UserInfo } from './types.js';

export const logger = createLogger('slack-user');

const toUserProfile = (user: User): UserInfo | undefined => {
  if (!user.id || !user.name) {
    return undefined;
  }
  return {
    id: user.id,
    name: user.name,
    realName: user.real_name,
    title: user.profile?.title,
  };
};

export const getInfo = async (client: WebClient, userId: string) => {
  const user = await client.users.info({ user: userId });
  if (!user.user) {
    return undefined;
  }
  return toUserProfile(user.user);
};

export const getProfile = async (client: WebClient, userId: string) => {
  const user = await client.users.profile.get({ user: userId });
  if (!user.profile) {
    return undefined;
  }
  return user.profile;
};

export const setProfile = async (
  client: WebClient,
  userId: string,
  profile: UsersProfileSetArguments['profile'],
) => {
  const response = await client.users.profile.set({ user: userId, profile });
  return response.ok;
};

export const getPresence = async (client: WebClient, userId: string) => {
  const user = await client.users.getPresence({ user: userId });
  if (!user.presence) {
    return undefined;
  }
  return user.presence;
};

export const setPresence = async (
  client: WebClient,
  presence: UsersSetPresenceArguments['presence'],
) => {
  const response = await client.users.setPresence({ presence });
  return response.ok;
};
