import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  BookmarksAddResponse,
  BookmarksEditResponse,
  BookmarksListResponse,
  BookmarksRemoveResponse,
} from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('slack-tools');

/**
 * Creates a tool to list all bookmarks in a Slack channel
 */
export const createListBookmarksTool = (
  listBookmarks: (channelId: string) => Promise<BookmarksListResponse>,
) =>
  new DynamicStructuredTool({
    name: 'list_slack_bookmarks',
    description: `List all bookmarks in a Slack channel.
    USE THIS WHEN:
    - You want to see all saved bookmarks in a channel
    - You need to find specific bookmarked content
    - You want to review channel resources`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to list bookmarks from.'),
    }),
    func: async ({ channelId }) => {
      try {
        logger.info('Listing bookmarks in Slack channel:', { channelId });
        const result = await listBookmarks(channelId);
        logger.info('Listed bookmarks in Slack:', { result });
        return {
          success: true,
          bookmarks: result.bookmarks,
        };
      } catch (error) {
        logger.error('Error listing bookmarks in Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to add a bookmark in a Slack channel
 */
export const createAddBookmarkTool = (
  addBookmark: (
    channelId: string,
    title: string,
    link: string,
    entityId?: string,
    emoji?: string,
  ) => Promise<BookmarksAddResponse>,
) =>
  new DynamicStructuredTool({
    name: 'add_slack_bookmark',
    description: `Add a bookmark to a Slack channel.
    USE THIS WHEN:
    - You want to save an important link
    - You need to bookmark a message for future reference
    - You want to add a resource to the channel
    FORMAT: Provide the channel ID, title, type (link or message), and optional parameters.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to add the bookmark to.'),
      title: z.string().describe('The title of the bookmark.'),
      link: z.string().describe('The URL to bookmark (required for link type).'),
      entityId: z
        .string()
        .optional()
        .describe('The message ID to bookmark (required for message type).'),
      emoji: z.string().optional().describe('The emoji to use as an icon for the bookmark.'),
    }),
    func: async ({ channelId, title, link, entityId, emoji }) => {
      try {
        logger.info('Adding bookmark in Slack:', {
          channelId,
          title,
          link,
          entityId,
          emoji,
        });
        const result = await addBookmark(channelId, title, link, entityId, emoji);
        logger.info('Added bookmark in Slack:', { result });
        return {
          success: true,
          bookmark: result,
        };
      } catch (error) {
        logger.error('Error adding bookmark in Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to edit a bookmark in a Slack channel
 */
export const createEditBookmarkTool = (
  editBookmark: (
    channelId: string,
    bookmarkId: string,
    title: string,
    emoji?: string,
  ) => Promise<BookmarksEditResponse>,
) =>
  new DynamicStructuredTool({
    name: 'edit_slack_bookmark',
    description: `Edit an existing bookmark in a Slack channel.
    USE THIS WHEN:
    - You need to update a bookmark's title
    - You want to change a bookmark's emoji
    FORMAT: Provide the channel ID, bookmark ID, new title, and optionally a new emoji.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the bookmark is located.'),
      bookmarkId: z.string().describe('The ID of the bookmark to edit.'),
      title: z.string().describe('The new title for the bookmark.'),
      emoji: z.string().optional().describe('The new emoji to use as an icon for the bookmark.'),
    }),
    func: async ({ channelId, bookmarkId, title, emoji }) => {
      try {
        logger.info('Editing bookmark in Slack:', {
          channelId,
          bookmarkId,
          title,
          emoji,
        });
        const result = await editBookmark(channelId, bookmarkId, title, emoji);
        logger.info('Edited bookmark in Slack:', { result });
        return {
          success: true,
          bookmark: result,
        };
      } catch (error) {
        logger.error('Error editing bookmark in Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to remove a bookmark from a Slack channel
 */
export const createRemoveBookmarkTool = (
  removeBookmark: (channelId: string, bookmarkId: string) => Promise<BookmarksRemoveResponse>,
) =>
  new DynamicStructuredTool({
    name: 'remove_slack_bookmark',
    description: `Remove a bookmark from a Slack channel.
    USE THIS WHEN:
    - You want to delete an outdated bookmark
    - You need to remove an incorrect bookmark
    - You want to clean up channel bookmarks`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the bookmark is located.'),
      bookmarkId: z.string().describe('The ID of the bookmark to remove.'),
    }),
    func: async ({ channelId, bookmarkId }) => {
      try {
        logger.info('Removing bookmark from Slack:', { channelId, bookmarkId });
        const result = await removeBookmark(channelId, bookmarkId);
        logger.info('Removed bookmark from Slack:', { result });
        return {
          success: true,
          bookmark: result,
        };
      } catch (error) {
        logger.error('Error removing bookmark from Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
