import type {
  CanvasesEditArguments,
  CanvasesSectionsLookupArguments,
  ConversationsCanvasesCreateArguments,
  WebClient,
} from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';

export const logger = createLogger('slack-canvas');

export const createChannel = async (client: WebClient, channelId: string, markdown: string) => {
  const options: ConversationsCanvasesCreateArguments = {
    channel_id: channelId,
    document_content: {
      type: 'markdown',
      markdown,
    },
  };
  const response = await client.conversations.canvases.create(options);
  logger.info('createChannel:', { response });
  return response;
};

export const edit = async (
  client: WebClient,
  canvasId: string,
  changes: CanvasesEditArguments['changes'],
) => {
  const options: CanvasesEditArguments = {
    canvas_id: canvasId,
    changes,
  };
  const response = await client.canvases.edit(options);
  logger.info('edit:', { response });
  return response;
};

export const sectionsLookup = async (
  client: WebClient,
  canvasId: string,
  criteria: CanvasesSectionsLookupArguments['criteria'],
) => {
  const options: CanvasesSectionsLookupArguments = {
    canvas_id: canvasId,
    criteria,
  };
  const response = await client.canvases.sections.lookup(options);
  logger.info('sectionsLookup:', { response });
  return response;
};
