import type { WebClient } from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';

export const logger = createLogger('slack-pin');

export const list = async (client: WebClient, channelId: string) => {
  const response = await client.pins.list({
    channel: channelId,
  });
  logger.info('getPins:', { response });
  return response;
};

export const add = async (client: WebClient, channelId: string, timestamp: string) => {
  const response = await client.pins.add({
    channel: channelId,
    timestamp,
  });
  logger.info('addPin:', { response });
  return response;
};

export const remove = async (client: WebClient, channelId: string, timestamp: string) => {
  const response = await client.pins.remove({
    channel: channelId,
    timestamp,
  });
  logger.info('removePin:', { response });
  return response;
};
