import type { WebClient } from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';

export const logger = createLogger('slack-reaction');

export const get = async (
  client: WebClient,
  channelId: string,
  timestamp: string,
  full: boolean = false,
) => {
  const response = await client.reactions.get({
    channel: channelId,
    timestamp,
    full,
  });
  logger.info('getReaction:', { response });
  return response;
};

export const add = async (
  client: WebClient,
  channelId: string,
  timestamp: string,
  reaction: string,
) => {
  const response = await client.reactions.add({
    channel: channelId,
    timestamp,
    name: reaction,
  });
  logger.info('addReaction:', { response });
  return response;
};

export const remove = async (
  client: WebClient,
  channelId: string,
  timestamp: string,
  reaction: string,
) => {
  const response = await client.reactions.remove({
    channel: channelId,
    timestamp,
    name: reaction,
  });
  logger.info('removeReaction:', { response });
  return response;
};

export const listEmojis = async (client: WebClient, includeCategories: boolean = false) => {
  const response = await client.emoji.list({
    include_categories: includeCategories,
  });
  logger.info('getEmojis:', { response });
  return response;
};
