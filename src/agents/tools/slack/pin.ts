import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  Block,
  ChatGetPermalinkResponse,
  ChatScheduleMessageResponse,
  ChatUpdateResponse,
  EmojiListResponse,
  PinsAddResponse,
  PinsListResponse,
  PinsRemoveResponse,
} from '@slack/web-api';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('slack-tools');

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
        return {
          success: true,
          pins: result.items,
        };
      } catch (error) {
        logger.error('Error listing pins from Slack:', error);
        return {
          success: false,
          error,
        };
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
        return {
          success: true,
          pin: result,
        };
      } catch (error) {
        logger.error('Error pinning message in Slack:', error);
        return {
          success: false,
          error,
        };
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
        return {
          success: true,
          pin: result,
        };
      } catch (error) {
        logger.error('Error removing pin in Slack:', error);
        return {
          success: false,
          error,
        };
      }
    },
  });
