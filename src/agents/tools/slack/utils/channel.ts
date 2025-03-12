import type { WebClient } from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';
import type { Channel, ChannelInfo } from './types.js';

export const logger = createLogger('slack-channel');

const fetchAllChannels = async (client: WebClient): Promise<ChannelInfo[]> => {
  const fetchPage = async (currentCursor?: string) => {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 1000,
      cursor: currentCursor,
    });

    return {
      channels: result.channels || [],
      nextCursor: result.response_metadata?.next_cursor,
    };
  };

  const getAllPages = async (accumulator: Channel[] = [], cursor?: string): Promise<Channel[]> => {
    const { channels, nextCursor } = await fetchPage(cursor);
    const updatedChannels = [...accumulator, ...(channels || [])];

    return nextCursor ? getAllPages(updatedChannels, nextCursor) : updatedChannels;
  };

  const allChannels = await getAllPages();

  return allChannels
    .filter(channel => channel.id && channel.name)
    .map(channel => ({
      id: channel.id ?? '',
      name: channel.name ?? '',
      isMember: channel.is_member ?? false,
    }));
};

export const getChannels = async (client: WebClient) => {
  return (await fetchAllChannels(client)).filter(c => c.isMember);
};
