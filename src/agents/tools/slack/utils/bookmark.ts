import type {
  BookmarksAddArguments,
  BookmarksEditArguments,
  BookmarksRemoveArguments,
  WebClient,
} from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';

export const logger = createLogger('slack-bookmark');

export const list = async (client: WebClient, channelId: string) => {
  const response = await client.bookmarks.list({
    channel_id: channelId,
  });
  logger.info('list:', { response });
  return response;
};

export const add = async (client: WebClient, options: BookmarksAddArguments) => {
  const response = await client.bookmarks.add(options);
  logger.info('add:', { response });
  return response;
};

export const edit = async (client: WebClient, options: BookmarksEditArguments) => {
  const response = await client.bookmarks.edit(options);
  logger.info('edit:', { response });
  return response;
};

export const remove = async (client: WebClient, options: BookmarksRemoveArguments) => {
  const response = await client.bookmarks.remove(options);
  logger.info('remove:', { response });
  return response;
};
