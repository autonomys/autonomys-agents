import type {
  ConversationsHistoryResponse,
  ConversationsListResponse,
  UsersInfoResponse,
} from '@slack/web-api';

export type Channel = NonNullable<ConversationsListResponse['channels']>[0];
export type ChannelInfo = {
  id: string;
  name: string;
  isMember: boolean;
};

export type User = NonNullable<UsersInfoResponse['user']>;
export type UserInfo = {
  id: string;
  name: string;
  realName?: string;
  title?: string;
};

export type MessageElement = NonNullable<ConversationsHistoryResponse['messages']>[0];
export type Message = {
  user: string;
  text: string;
  ts: string;
  postedAt: Date;
  blocks?: MessageElement['blocks'];
};

export type MessageInfo = Message & {
  replies: Message[];
  thread_ts: string;
};
