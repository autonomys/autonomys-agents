import {
  BookmarksAddArguments,
  BookmarksEditArguments,
  BookmarksRemoveArguments,
  ChatPostMessageArguments,
  ChatScheduleMessageArguments,
  ChatUpdateArguments,
  UsersProfileSetArguments,
  UsersSetPresenceArguments,
  WebClient,
} from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';
import * as Bookmark from './bookmark.js';
import * as Channel from './channel.js';
import * as Chat from './chat.js';
import * as Pin from './pin.js';
import * as Reaction from './reaction.js';
import * as User from './user.js';

export const logger = createLogger('slack-client');

export const slackClient = async (token: string) => {
  const client = new WebClient(token);
  const authTest = await client.auth.test();
  const botId =
    authTest.user_id ??
    (() => {
      throw new Error('Failed to authenticate with Slack');
    })();

  // Users
  const getUserInfo = async (userId: string) => User.getInfo(client, userId);
  const getUserProfile = async (userId: string) => User.getProfile(client, userId);
  const setUserProfile = async (userId: string, profile: UsersProfileSetArguments['profile']) =>
    User.setProfile(client, userId, profile);
  const getUserPresence = async (userId: string) => User.getPresence(client, userId);
  const setUserPresence = async (presence: UsersSetPresenceArguments['presence']) =>
    User.setPresence(client, presence);

  // Channels
  const getUserChannels = async () => Channel.getChannels(client);

  // Chat
  const getMessages = async (channelId: string, limit: number = 10) =>
    Chat.getMessages(client, channelId, limit);
  const postMessage = async (message: ChatPostMessageArguments) =>
    Chat.postMessage(client, message);
  const editMessage = async (options: ChatUpdateArguments) => Chat.editMessage(client, options);
  const scheduleMessage = async (options: ChatScheduleMessageArguments) =>
    Chat.scheduleMessage(client, options);
  const getPermalink = async (channelId: string, messageTs: string) =>
    Chat.getPermalink(client, channelId, messageTs);

  // Reactions
  const getReaction = async (channelId: string, timestamp: string, full: boolean = false) =>
    await Reaction.get(client, channelId, timestamp, full);
  const addReaction = async (channelId: string, timestamp: string, reaction: string) =>
    await Reaction.add(client, channelId, timestamp, reaction);
  const removeReaction = async (channelId: string, timestamp: string, reaction: string) =>
    await Reaction.remove(client, channelId, timestamp, reaction);
  const getEmojis = async (includeCategories: boolean = false) =>
    await Reaction.listEmojis(client, includeCategories);

  // Bookmarks
  const listBookmarks = async (channelId: string) => await Bookmark.list(client, channelId);
  const addBookmark = async (options: BookmarksAddArguments) => await Bookmark.add(client, options);
  const editBookmark = async (options: BookmarksEditArguments) =>
    await Bookmark.edit(client, options);
  const removeBookmark = async (options: BookmarksRemoveArguments) =>
    await Bookmark.remove(client, options);

  // Pins
  const getPins = async (channelId: string) => await Pin.list(client, channelId);
  const addPin = async (channelId: string, timestamp: string) =>
    await Pin.add(client, channelId, timestamp);
  const removePin = async (channelId: string, timestamp: string) =>
    await Pin.remove(client, channelId, timestamp);

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
    removeReaction,
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
