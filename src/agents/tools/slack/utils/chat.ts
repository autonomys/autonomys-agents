import type {
  ChatPostMessageArguments,
  ChatScheduleMessageArguments,
  ChatUpdateArguments,
  WebClient,
} from '@slack/web-api';
import { createLogger } from '../../../../utils/logger.js';
import type { Message, MessageElement, MessageInfo } from './types.js';

export const logger = createLogger('slack-chat');

const toMessage = ({ user, text, ts }: MessageElement): Message | undefined => {
  if (!user || !text || !ts) {
    return undefined;
  }
  const postedAt = new Date(parseFloat(ts) * 1000);
  return {
    user,
    text,
    ts,
    postedAt,
  };
};

const fetchMessages = async (
  client: WebClient,
  channelId: string,
  limit: number = 10,
): Promise<MessageInfo[]> => {
  const { messages } = await client.conversations.history({ channel: channelId, limit });
  if (!messages) {
    return [];
  }
  const threadMessages = messages
    .map(async message => {
      const cleanMessage = toMessage(message);
      if (!cleanMessage) return undefined;

      if (message.thread_ts) {
        const replies = await client.conversations.replies({
          channel: channelId,
          ts: message.thread_ts,
        });
        const repliesMessages = replies.messages?.map(toMessage).filter(Boolean);
        return { ...cleanMessage, thread_ts: message.thread_ts, replies: repliesMessages ?? [] };
      }
      return { ...cleanMessage, thread_ts: '', replies: [] };
    })
    .filter(Boolean) as Promise<MessageInfo>[];

  return (await Promise.all(threadMessages)).filter(Boolean) as MessageInfo[];
};

export const getMessages = async (client: WebClient, channelId: string, limit: number = 10) => {
  return fetchMessages(client, channelId, limit);
};

export const postMessage = async (client: WebClient, message: ChatPostMessageArguments) => {
  const response = await client.chat.postMessage(message);
  logger.info('postMessage:', { response });
  return response;
};

export const editMessage = async (client: WebClient, options: ChatUpdateArguments) => {
  const response = await client.chat.update(options);
  logger.info('editMessage:', { response });
  return response;
};

export const scheduleMessage = async (client: WebClient, options: ChatScheduleMessageArguments) => {
  const response = await client.chat.scheduleMessage(options);
  logger.info('scheduleMessage:', { response });
  return response;
};

export const getPermalink = async (client: WebClient, channelId: string, messageTs: string) => {
  const response = await client.chat.getPermalink({
    channel: channelId,
    message_ts: messageTs,
  });
  logger.info('getPermalink:', { response });
  return response;
};
