import { Block, UsersProfileSetArguments } from '@slack/web-api';
import {
  createAddBookmarkTool,
  createEditBookmarkTool,
  createListBookmarksTool,
  createRemoveBookmarkTool,
} from './bookmark.js';
import { createListChannelsTool } from './channel.js';
import {
  createEditMessageTool,
  createGetPermalinkTool,
  createListMessagesTool,
  createPostSlackMsgTool,
  createScheduleMessageTool,
} from './chat.js';
import { slackClient } from './client.js';
import { createAddPinTool, createListPinsTool, createRemovePinTool } from './pin.js';
import {
  createAddReactionTool,
  createGetReactionTool,
  createListEmojisTool,
  createRemoveReactionTool,
} from './reaction.js';
import {
  createGetUserInfoTool,
  createGetUserPresenceTool,
  createGetUserProfileTool,
  createSetUserPresenceTool,
  createSetUserProfileTool,
} from './user.js';

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
  const removeReaction = (channelId: string, timestamp: string, reaction: string) =>
    slack.removeReaction(channelId, timestamp, reaction);
  const getReaction = (channelId: string, timestamp: string) =>
    slack.getReaction(channelId, timestamp);
  const editMessage = (channelId: string, ts: string, text: string, blocks?: Block[]) =>
    slack.editMessage({ channel: channelId, ts, text, blocks });
  const scheduleMessage = (
    channelId: string,
    text: string,
    postAt: number,
    blocks?: Block[],
    threadTs?: string,
  ) =>
    slack.scheduleMessage({
      channel: channelId,
      text,
      post_at: postAt,
      blocks,
      thread_ts: threadTs,
    });
  const getPermalink = (channelId: string, messageTs: string) =>
    slack.getPermalink(channelId, messageTs);
  const listBookmarks = (channelId: string) => slack.listBookmarks(channelId);
  const addBookmark = (
    channelId: string,
    title: string,
    link: string,
    entityId?: string,
    emoji?: string,
  ) =>
    slack.addBookmark({
      channel_id: channelId,
      title,
      type: 'link',
      link,
      entity_id: entityId,
      emoji,
    });
  const editBookmark = (channelId: string, bookmarkId: string, title: string, emoji?: string) =>
    slack.editBookmark({ channel_id: channelId, bookmark_id: bookmarkId, title, emoji });
  const removeBookmark = (channelId: string, bookmarkId: string) =>
    slack.removeBookmark({ channel_id: channelId, bookmark_id: bookmarkId });

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
    createRemoveReactionTool(removeReaction),
    createGetReactionTool(getReaction),
    createListPinsTool(slack.getPins),
    createAddPinTool(slack.addPin),
    createRemovePinTool(slack.removePin),
    createListEmojisTool(slack.getEmojis),
    createEditMessageTool(editMessage),
    createScheduleMessageTool(scheduleMessage),
    createGetPermalinkTool(getPermalink),
    createListBookmarksTool(listBookmarks),
    createAddBookmarkTool(addBookmark),
    createEditBookmarkTool(editBookmark),
    createRemoveBookmarkTool(removeBookmark),
  ];
};

export default createSlackTools;
