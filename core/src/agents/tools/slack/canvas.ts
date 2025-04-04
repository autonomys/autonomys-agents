import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  BookmarksAddResponse,
  BookmarksEditResponse,
  BookmarksRemoveResponse,
  CanvasesEditArguments,
  CanvasesSectionsLookupArguments,
} from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('slack-tools');

/**
 * Creates a tool to create a channel canvas in a Slack channel
 */
export const createChannelCanvasTool = (
  createChannelCanvas: (channelId: string, markdown: string) => Promise<BookmarksAddResponse>,
) =>
  new DynamicStructuredTool({
    name: 'create_slack_channel_canvas',
    description: `Create a canvas in a Slack channel.
    USE THIS WHEN:
    - You want or need to create a canvas in a Slack channel
    - You want to add a resource to the channel
    - You are working on a long form document and want it to remain easy to access
    FORMAT: Provide the channel ID and markdown.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID to add the bookmark to.'),
      markdown: z.string().describe('The markdown to add to the canvas.'),
    }),
    func: async ({ channelId, markdown }) => {
      try {
        logger.info('Creating channel canvas in Slack:', {
          channelId,
          markdown,
        });
        const result = await createChannelCanvas(channelId, markdown);
        logger.info('Created channel canvas in Slack:', { result });
        return {
          success: true,
          canvas: result,
        };
      } catch (error) {
        logger.error('Error creating channel canvas in Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to edit a channel canvas in a Slack channel
 */
export const createEditChannelCanvasTool = (
  editChannelCanvas: (
    channelId: string,
    canvasId: string,
    changes: CanvasesEditArguments['changes'],
  ) => Promise<BookmarksEditResponse>,
) =>
  new DynamicStructuredTool({
    name: 'edit_slack_channel_canvas',
    description: `Edit an existing channel canvas in a Slack channel.
    USE THIS WHEN:
    - You need to update a channel canvas's content
    - You need to add a new section to a channel canvas
    - You need to delete a section from a channel canvas
    FORMAT: Provide the channel ID, canvas ID, and changes to the canvas.`,
    schema: z.object({
      channelId: z.string().describe('The channel ID where the canvas is located.'),
      canvasId: z.string().describe('The ID of the canvas to edit.'),
      changes: z.array(z.any()).describe('The changes to the canvas.'),
    }),
    func: async ({ channelId, canvasId, changes }) => {
      try {
        logger.info('Editing channel canvas in Slack:', {
          channelId,
          canvasId,
          changes,
        });
        const result = await editChannelCanvas(
          channelId,
          canvasId,
          changes as CanvasesEditArguments['changes'],
        );
        logger.info('Edited channel canvas in Slack:', { result });
        return {
          success: true,
          canvas: result,
        };
      } catch (error) {
        logger.error('Error editing channel canvas in Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });

/**
 * Creates a tool to lookup sections in a canvas
 */
export const canvasSectionsLookupTool = (
  canvasSectionsLookup: (
    canvasId: string,
    criteria: CanvasesSectionsLookupArguments['criteria'],
  ) => Promise<BookmarksRemoveResponse>,
) =>
  new DynamicStructuredTool({
    name: 'canvas_sections_lookup',
    description: `Lookup sections in a canvas.
    USE THIS WHEN:
    - You want to find a section in a canvas  `,
    schema: z.object({
      canvasId: z.string().describe('The ID of the canvas to lookup sections in.'),
      criteria: z.any().describe('The criteria to lookup sections in.'),
    }),
    func: async ({ canvasId, criteria }) => {
      try {
        logger.info('Lookup sections in a canvas:', { canvasId, criteria });
        const result = await canvasSectionsLookup(canvasId, criteria);
        logger.info('Lookup sections in a canvas:', { result });
        return {
          success: true,
          sections: result,
        };
      } catch (error) {
        logger.error('Error lookup sections in a canvas:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
