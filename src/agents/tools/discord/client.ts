import {
  Client,
  GatewayIntentBits,
  Guild,
  GuildBasedChannel,
  Message,
  TextChannel,
  User,
} from 'discord.js';

export type ServerInfo = {
  id: string;
  name: string;
};

export type ChannelInfo = {
  id: string;
  name: string;
  serverId: string;
};

export type UserInfo = {
  id: string;
  username: string;
  displayName?: string;
};

export type MentionInfo = {
  users: UserInfo[];
  roles: { id: string; name: string }[];
  everyone: boolean;
};

export type MessageInfo = {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  timestamp: Date;
  replies: MessageInfo[];
  mentions: MentionInfo;
};

const toServerInfo = (guild: Guild): ServerInfo => ({
  id: guild.id,
  name: guild.name,
});

const toChannelInfo = (channel: GuildBasedChannel): ChannelInfo | undefined => {
  if (!channel.isTextBased()) return undefined;
  return {
    id: channel.id,
    name: channel.name,
    serverId: channel.guild.id,
  };
};

const toUserInfo = (user: User): UserInfo => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
});

const toMessageInfo = (message: Message): MessageInfo => ({
  id: message.id,
  content: message.content,
  authorId: message.author.id,
  channelId: message.channelId,
  timestamp: message.createdAt,
  replies: [],
  mentions: {
    users: Array.from(message.mentions.users.values()).map(toUserInfo),
    roles: Array.from(message.mentions.roles.values()).map(role => ({
      id: role.id,
      name: role.name,
    })),
    everyone: message.mentions.everyone,
  },
});

export const discordClient = async (token: string) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  await client.login(token);
  const botId =
    client.user?.id ??
    (() => {
      throw new Error('Failed to authenticate with Discord');
    })();

  const getServers = async (): Promise<ServerInfo[]> => {
    return Array.from(client.guilds.cache.values()).map(toServerInfo);
  };

  const getChannels = async (serverId: string): Promise<ChannelInfo[]> => {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return [];

    return Array.from(guild.channels.cache.values())
      .map(toChannelInfo)
      .filter((channel): channel is ChannelInfo => channel !== undefined);
  };

  const getUserInfo = async (userId: string): Promise<UserInfo | undefined> => {
    try {
      const user = await client.users.fetch(userId);
      return toUserInfo(user);
    } catch {
      return undefined;
    }
  };

  const getMessages = async (channelId: string, limit: number = 10): Promise<MessageInfo[]> => {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      return [];
    }

    const messages = await channel.messages.fetch({ limit });
    const messageInfos = Array.from(messages.values()).map(async message => {
      const baseMessage = toMessageInfo(message);

      if (message.reference?.messageId) {
        try {
          const thread = await message.fetchReference();
          const replies = [toMessageInfo(thread)];
          return { ...baseMessage, replies };
        } catch {
          return baseMessage;
        }
      }

      return baseMessage;
    });

    return Promise.all(messageInfos);
  };

  const postMessage = async (channelId: string, content: string) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error('Invalid channel');
    }

    const message = await channel.send(content);
    return {
      success: true,
      channel: channelId,
      message: content,
      messageId: message.id,
    };
  };

  const getReactions = async (channelId: string, messageId: string) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error('Invalid channel');
    }

    const message = await channel.messages.fetch(messageId);
    return {
      success: true,
      channel: channelId,
      reactions: Array.from(message.reactions.cache.values()).map(reaction => ({
        name: reaction.emoji.name,
        count: reaction.count,
      })),
    };
  };

  const addReaction = async (channelId: string, messageId: string, reaction: string) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error('Invalid channel');
    }

    const message = await channel.messages.fetch(messageId);
    await message.react(reaction);

    return {
      success: true,
      channel: channelId,
      reaction,
    };
  };

  const replyToMessage = async (channelId: string, messageId: string, content: string) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error('Invalid channel');
    }

    const message = await channel.messages.fetch(messageId);
    const reply = await message.reply(content);

    return {
      success: true,
      channel: channelId,
      message: content,
      messageId: reply.id,
      replyTo: messageId,
    };
  };

  return {
    client,
    userId: botId,
    getServers,
    getChannels,
    getMessages,
    getUserInfo,
    postMessage,
    getReactions,
    addReaction,
    replyToMessage,
  };
};

export default discordClient;
