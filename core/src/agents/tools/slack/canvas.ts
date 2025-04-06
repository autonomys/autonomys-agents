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

// Define a schema for canvas blocks
const canvasBlockSchema = z
  .object({
    type: z.string().describe('The type of block'),
    text: z
      .object({
        text: z.string().describe('The text content'),
        type: z.string().describe('The type of text (plain_text or mrkdwn)'),
      })
      .optional()
      .describe('Text content for the block'),
  })
  .passthrough();

// Define a schema for canvas changes
const canvasChangeSchema = z
  .object({
    title: z.string().optional().describe('New title for the canvas'),
    initial_blocks: z.array(canvasBlockSchema).optional().describe('Blocks to set for the canvas'),
  })
  .passthrough();

// Define a schema for canvas section lookup criteria
const canvasCriteriaSchema = z
  .object({
    section_id: z.string().optional().describe('ID of the section to lookup'),
    blocks_after: z.string().optional().describe('ID of the block to search after'),
    blocks_before: z.string().optional().describe('ID of the block to search before'),
    blocks_limit: z.number().optional().describe('Maximum number of blocks to return'),
    contains_text: z.string().describe('Text to search for within sections (required)'),
  })
  .passthrough();

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
      changes: z
        .array(canvasChangeSchema)
        .describe(
          'The changes to apply to the canvas. Each change should include properties like title or initial_blocks.',
        ),
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
      criteria: canvasCriteriaSchema.describe(
        'The criteria to lookup sections by, such as section_id or blocks_limit.',
      ),
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
