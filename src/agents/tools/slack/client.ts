import {
  BookmarksAddArguments,
  BookmarksEditArguments,
  BookmarksRemoveArguments,
  ChatPostMessageArguments,
  ChatScheduleMessageArguments,
  ChatUpdateArguments,
  ConversationsHistoryResponse,
  ConversationsListResponse,
  UsersInfoResponse,
  UsersProfileSetArguments,
  UsersSetPresenceArguments,
  WebClient,
} from '@slack/web-api';
import { createLogger } from '../../../utils/logger.js';

type Channel = NonNullable<ConversationsListResponse['channels']>[0];
export type ChannelInfo = {
  id: string;
  name: string;
  isMember: boolean;
};

type User = NonNullable<UsersInfoResponse['user']>;
export type UserInfo = {
  id: string;
  name: string;
  realName?: string;
  title?: string;
};

type MessageElement = NonNullable<ConversationsHistoryResponse['messages']>[0];
type Message = {
  user: string;
  text: string;
  ts: string;
  postedAt: Date;
};

export type MessageInfo = Message & {
  replies: Message[];
  thread_ts: string;
};

export const logger = createLogger('slack-client');

const toMessage = ({ user, text, ts }: MessageElement): Message | undefined => {
  if (!user || !text || !ts) {
    return undefined;
  }
  const postedAt = new Date(parseFloat(ts) * 1000);
  return {
    user,
    text,
    ts,
    postedAt,
  };
};

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

const fetchAllChannels = async (client: WebClient): Promise<ChannelInfo[]> => {
  const fetchPage = async (currentCursor?: string) => {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 1000,
      cursor: currentCursor,
    });

    return {
      channels: result.channels || [],
      nextCursor: result.response_metadata?.next_cursor,
    };
  };

  const getAllPages = async (accumulator: Channel[] = [], cursor?: string): Promise<Channel[]> => {
    const { channels, nextCursor } = await fetchPage(cursor);
    const updatedChannels = [...accumulator, ...(channels || [])];

    return nextCursor ? getAllPages(updatedChannels, nextCursor) : updatedChannels;
  };

  const allChannels = await getAllPages();

  return allChannels
    .filter(channel => channel.id && channel.name)
    .map(channel => ({
      id: channel.id ?? '',
      name: channel.name ?? '',
      isMember: channel.is_member ?? false,
    }));
};

const fetchMessages = async (
  client: WebClient,
  channelId: string,
  limit: number = 10,
): Promise<MessageInfo[]> => {
  const { messages } = await client.conversations.history({ channel: channelId, limit });
  if (!messages) {
    return [];
  }
  const threadMessages = messages
    .map(async message => {
      const cleanMessage = toMessage(message);
      if (!cleanMessage) return undefined;

      if (message.thread_ts) {
        const replies = await client.conversations.replies({
          channel: channelId,
          ts: message.thread_ts,
        });
        const repliesMessages = replies.messages?.map(toMessage).filter(Boolean);
        return { ...cleanMessage, thread_ts: message.thread_ts, replies: repliesMessages ?? [] };
      }
      return { ...cleanMessage, thread_ts: '', replies: [] };
    })
    .filter(Boolean) as Promise<MessageInfo>[];

  return (await Promise.all(threadMessages)).filter(Boolean) as MessageInfo[];
};

export const slackClient = async (token: string) => {
  const client = new WebClient(token);
  const authTest = await client.auth.test();
  const botId =
    authTest.user_id ??
    (() => {
      throw new Error('Failed to authenticate with Slack');
    })();

  const getUserInfo = async (userId: string) => {
    const user = await client.users.info({ user: userId });
    if (!user.user) {
      return undefined;
    }
    return toUserProfile(user.user);
  };

  const getUserProfile = async (userId: string) => {
    const user = await client.users.profile.get({ user: userId });
    if (!user.profile) {
      return undefined;
    }
    return user.profile;
  };

  const setUserProfile = async (userId: string, profile: UsersProfileSetArguments['profile']) => {
    const response = await client.users.profile.set({ user: userId, profile });
    return response.ok;
  };

  const getUserPresence = async (userId: string) => {
    const user = await client.users.getPresence({ user: userId });
    if (!user.presence) {
      return undefined;
    }
    return user.presence;
  };

  const setUserPresence = async (presence: UsersSetPresenceArguments['presence']) => {
    const response = await client.users.setPresence({ presence });
    return response.ok;
  };

  const getUserChannels = async () => {
    return (await fetchAllChannels(client)).filter(c => c.isMember);
  };

  const getMessages = async (channelId: string, limit: number = 10) => {
    return fetchMessages(client, channelId, limit);
  };

  const postMessage = async (message: ChatPostMessageArguments) => {
    const response = await client.chat.postMessage(message);
    logger.info('postMessage:', { response });
    return response;
  };

  const editMessage = async (options: ChatUpdateArguments) => {
    const response = await client.chat.update(options);
    logger.info('editMessage:', { response });
    return response;
  };

  const scheduleMessage = async (options: ChatScheduleMessageArguments) => {
    const response = await client.chat.scheduleMessage(options);
    logger.info('scheduleMessage:', { response });
    return response;
  };

  const getPermalink = async (channelId: string, messageTs: string) => {
    const response = await client.chat.getPermalink({
      channel: channelId,
      message_ts: messageTs,
    });
    logger.info('getPermalink:', { response });
    return response;
  };

  const getReaction = async (channelId: string, timestamp: string, full: boolean = false) => {
    const response = await client.reactions.get({
      channel: channelId,
      timestamp,
      full,
    });
    logger.info('getReaction:', { response });
    return response;
  };

  const addReaction = async (channelId: string, timestamp: string, reaction: string) => {
    const response = await client.reactions.add({
      channel: channelId,
      timestamp,
      name: reaction,
    });
    logger.info('addReaction:', { response });
    return response;
  };

  const getPins = async (channelId: string) => {
    const response = await client.pins.list({
      channel: channelId,
    });
    logger.info('getPins:', { response });
    return response;
  };

  const addPin = async (channelId: string, timestamp: string) => {
    const response = await client.pins.add({
      channel: channelId,
      timestamp,
    });
    logger.info('addPin:', { response });
    return response;
  };

  const removePin = async (channelId: string, timestamp: string) => {
    const response = await client.pins.remove({
      channel: channelId,
      timestamp,
    });
    logger.info('removePin:', { response });
    return response;
  };

  const listBookmarks = async (channelId: string) => {
    const response = await client.bookmarks.list({
      channel_id: channelId,
    });
    logger.info('listBookmarks:', { response });
    return response;
  };

  const addBookmark = async (options: BookmarksAddArguments) => {
    const response = await client.bookmarks.add(options);
    logger.info('addBookmark:', { response });
    return response;
  };

  const editBookmark = async (options: BookmarksEditArguments) => {
    const response = await client.bookmarks.edit(options);
    logger.info('editBookmark:', { response });
    return response;
  };

  const removeBookmark = async (options: BookmarksRemoveArguments) => {
    const response = await client.bookmarks.remove(options);
    logger.info('removeBookmark:', { response });
    return response;
  };

  const getEmojis = async (includeCategories: boolean = false) => {
    const response = await client.emoji.list({
      include_categories: includeCategories,
    });
    logger.info('getEmojis:', { response });
    return response;
  };

  return {
    client,
    userId: botId,
    getUserInfo,
    getUserProfile,
    setUserProfile,
    getUserPresence,
    setUserPresence,
    getUserChannels,
    getMessages,
    postMessage,
    editMessage,
    scheduleMessage,
    getPermalink,
    getReaction,
    addReaction,
    getPins,
    addPin,
    removePin,
    getEmojis,
    listBookmarks,
    addBookmark,
    editBookmark,
    removeBookmark,
  };
};

export default slackClient;
