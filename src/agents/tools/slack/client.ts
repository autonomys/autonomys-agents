import {
  ConversationsHistoryResponse,
  ConversationsListResponse,
  UsersInfoResponse,
  WebClient,
} from '@slack/web-api';

type Channel = NonNullable<ConversationsListResponse['channels']>[0];
export type ChannelInfo = {
  id: string;
  name: string;
  isMember: boolean;
};

type User = NonNullable<UsersInfoResponse['user']>;
export type UserInfo = {
  id: string;
  name: string;
  realName?: string;
  title?: string;
};

type MessageElement = NonNullable<ConversationsHistoryResponse['messages']>[0];
type Message = {
  user: string;
  text: string;
  ts: string;
  postedAt: Date;
};

export type MessageInfo = Message & {
  replies: Message[];
  thread_ts: string;
};

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

const toUserProfile = (user: User): UserInfo | undefined => {
  if (!user.id || !user.name) {
    return undefined;
  }
  return {
    id: user.id,
    name: user.name,
    realName: user.real_name,
    title: user.profile?.title,
  };
};

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
      id: channel.id!,
      name: channel.name!,
      isMember: channel.is_member ?? false,
    }));
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

export const slackClient = async (token: string) => {
  const client = new WebClient(token);
  const authTest = await client.auth.test();
  const botId =
    authTest.user_id ??
    (() => {
      throw new Error('Failed to authenticate with Slack');
    })();

  const getUserInfo = async (userId: string) => {
    const user = await client.users.info({ user: userId });
    if (!user.user) {
      return undefined;
    }
    return toUserProfile(user.user);
  };

  const getUserChannels = async () => {
    return (await fetchAllChannels(client)).filter(c => c.isMember);
  };

  const getMessages = async (channelId: string, limit: number = 10) => {
    return fetchMessages(client, channelId, limit);
  };

  const postMessage = async (channelId: string, message: string, threadTs?: string) => {
    const response = await client.chat.postMessage({
      channel: channelId,
      text: message,
      thread_ts: threadTs,
    });
    return {
      success: true,
      channel: channelId,
      message: message,
      ts: response.ts ?? '',
    };
  };

  return {
    client,
    userId: botId,
    getUserChannels,
    getMessages,
    getUserInfo,
    postMessage,
  };
};

export default slackClient;
