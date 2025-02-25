import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { isValidTweet } from './convertFromTimeline.js';
import { convertTimelineTweetToTweet } from './convertFromTimeline.js';
import { TwitterApi } from './types.js';
import { createLogger } from '../../utils/logger.js';
const logger = createLogger('twitter-api');

const loadCookies = async (scraper: Scraper, cookiesPath: string): Promise<void> => {
  logger.info('Loading existing cookies');
  const cookies = readFileSync(cookiesPath, 'utf8');
  try {
    const parsedCookies = JSON.parse(cookies).map(
      (
        cookie: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      ) => `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`,
    );
    await scraper.setCookies(parsedCookies);
    logger.info('Loaded existing cookies from file');
  } catch (error) {
    logger.error('Error loading cookies:', error);
    throw error;
  }
};

const login = async (
  scraper: Scraper,
  username: string,
  password: string,
  cookiesPath: string,
): Promise<void> => {
  logger.info('No existing cookies found, proceeding with login');
  await scraper.login(username, password);

  const newCookies = await scraper.getCookies();
  writeFileSync(cookiesPath, JSON.stringify(newCookies, null, 2));
  logger.info('New cookies saved to file');
};

const iterateResponse = async <T>(response: AsyncGenerator<T>): Promise<T[]> => {
  const iterated: T[] = [];
  for await (const item of response) {
    iterated.push(item);
  }
  return iterated;
};

const getUserReplyIds = async (
  scraper: Scraper,
  username: string,
  maxRepliesToCheck = 100,
): Promise<Set<string>> => {
  const replyIdSet = new Set<string>();

  // Query: all recent tweets from the user that are replies to someone else
  const userRepliesIterator = scraper.searchTweets(
    `from:${username} @`, // "from: user" + "@" ensures it's a reply/mention
    maxRepliesToCheck,
    SearchMode.Latest,
  );

  for await (const reply of userRepliesIterator) {
    if (reply.inReplyToStatusId) {
      replyIdSet.add(reply.inReplyToStatusId);
    }
  }

  return replyIdSet;
};

const getMyRecentReplies = async (
  scraper: Scraper,
  username: string,
  maxResults: number = 10,
): Promise<Tweet[]> => {
  const userRepliesIterator = scraper.searchTweets(
    `from:${username} filter:replies`,
    maxResults,
    SearchMode.Latest,
  );
  const replies: Tweet[] = [];
  try {
    for await (const reply of userRepliesIterator) {
      replies.push(reply);
    }
  } catch (error) {
    logger.error('Error fetching replies:', error);
  }
  return replies;
};
const getReplyThread = (tweet: Tweet, conversation: Tweet[], maxThreadDepth: number): Tweet[] => {
  const replyThread: Tweet[] = [];
  let currentTweet = tweet;

  while (replyThread.length <= maxThreadDepth) {
    if (currentTweet.inReplyToStatusId) {
      const parentTweet = conversation.find(t => t.id === currentTweet.inReplyToStatusId);
      if (parentTweet) {
        replyThread.unshift(parentTweet);
        currentTweet = parentTweet;
      } else {
        break;
      }
    } else {
      if (!replyThread.some(t => t.id === currentTweet.id)) {
        replyThread.unshift(currentTweet);
      }
      break;
    }
  }
  logger.info('replyThread', { id: tweet.id, length: replyThread.length });
  return replyThread;
};

const getMyUnrepliedToMentions = async (
  scraper: Scraper,
  username: string,
  maxThreadDepth: number,
  ignoreConversationIds: string[],
  maxResults: number = 50,
  sinceId?: string,
): Promise<Tweet[]> => {
  logger.info('Getting my mentions', { username, maxResults, sinceId });

  const queryConversationIds = ignoreConversationIds.map(id => `-conversation_id:${id}`).join(' ');
  const query = `@${username} -from:${username} ${queryConversationIds}`;
  const mentionIterator = scraper.searchTweets(query, maxResults, SearchMode.Latest);

  // build a set of "already replied to" tweet IDs in one query
  const repliedToIds = await getUserReplyIds(scraper, username, 100);

  // filter out any mention we've already replied to
  const newMentions: Tweet[] = [];
  const conversations = new Map<string, Tweet[]>();
  for await (const tweet of mentionIterator) {
    // Skip tweets without an ID
    if (!tweet.id || (tweet.conversationId && ignoreConversationIds.includes(tweet.conversationId)))
      continue;

    // Stop if we've reached or passed the sinceId
    if (sinceId && tweet.id <= sinceId) {
      break;
    }

    // Skip if user has already replied
    if (repliedToIds.has(tweet.id)) {
      logger.info(`Skipping tweet ${tweet.id} (already replied)`);
      continue;
    }
    newMentions.push(tweet);

    // Skip tweets without conversation ID
    if (!tweet.conversationId) continue;

    if (!conversations.has(tweet.id)) {
      const conversation = await iterateResponse(
        scraper.searchTweets(`conversation_id:${tweet.conversationId}`, 100, SearchMode.Latest),
      );

      const initialTweet = await scraper.getTweet(tweet.conversationId);
      if (initialTweet) {
        conversation.push(initialTweet);
      }
      conversations.set(tweet.conversationId, conversation);
    }

    // Stop if we already have enough
    if (newMentions.length >= maxResults) {
      break;
    }
  }

  const withThreads = newMentions.map(mention => {
    // Skip mentions without conversation ID
    if (!mention.conversationId) return mention;

    const conversation = conversations.get(mention.conversationId);
    if (!conversation) return mention;

    const thread = getReplyThread(mention, conversation, maxThreadDepth);
    return {
      ...mention,
      thread,
    };
  });

  return withThreads;
};

const getFollowingRecentTweets = async (
  scraper: Scraper,
  username: string,
  maxResults: number = 50,
  randomNumberOfUsers: number = 10,
): Promise<Tweet[]> => {
  logger.info('Getting following recent tweets', {
    username,
    maxResults,
    randomNumberOfUsers,
  });
  const userId = await scraper.getUserIdByScreenName(username);
  const following = await iterateResponse(scraper.getFollowing(userId, 100));
  const randomFollowing = [...following]
    .sort(() => 0.5 - Math.random())
    .slice(0, randomNumberOfUsers);

  logger.info('Random Following', {
    randomFollowing: randomFollowing.map(user => user.username),
  });

  const query = `(${randomFollowing.map(user => `from:${user.username}`).join(' OR ')})`;
  const tweets = await iterateResponse(scraper.searchTweets(query, maxResults, SearchMode.Latest));
  return tweets;
};

const findTweetId = async (scraper: Scraper, tweetText: string, username: string) => {
  const maxRetries = 4;
  const baseDelay = 500;

  for (let i = 0; i < maxRetries; i++) {
    const delay = baseDelay * Math.pow(2, i);
    await new Promise(resolve => setTimeout(resolve, delay));

    const recentTweets = await iterateResponse(
      scraper.searchTweets(`from:${username}`, 5, SearchMode.Latest),
    );

    const sentTweet = recentTweets.find(tweet => tweet.text?.includes(tweetText));
    if (sentTweet?.id) {
      logger.info('Tweet ID confirmed', { id: sentTweet.id, attemptNumber: i + 1 });
      return sentTweet.id;
    }
    logger.debug('Tweet ID not found, retrying', { attemptNumber: i + 1, nextDelay: delay * 2 });
  }
  logger.warn('Tweet ID could not be confirmed after all retries', { tweetText, username });
  return '';
};

export const createTwitterApi = async (
  username: string,
  password: string,
  cookiesPath: string = 'cookies.json',
): Promise<TwitterApi> => {
  const scraper = new Scraper();

  // Initialize authentication
  if (existsSync(cookiesPath)) {
    await loadCookies(scraper, cookiesPath);
  } else {
    await login(scraper, username, password, cookiesPath);
  }

  const isLoggedIn = await scraper.isLoggedIn();
  logger.info(`Login status: ${isLoggedIn}`);

  if (!isLoggedIn) {
    logger.info(`Previous cookies is likely expired or invalid, logging in again`);
    try {
      await login(scraper, username, password, cookiesPath);
      const isSecondLoginSuccessful = await scraper.isLoggedIn();
      logger.info(`Login status: ${isSecondLoginSuccessful}`);
      if (!isSecondLoginSuccessful) {
        throw new Error('Failed to initialize Twitter Api - not logged in');
      }
    } catch {
      throw new Error('Failed to initialize Twitter Api - not logged in');
    }
  }

  const cleanTimelineTweets = (tweets: unknown[], count: number) => {
    const cleanedTweets = tweets
      .filter(isValidTweet)
      .map(tweet => convertTimelineTweetToTweet(tweet));

    // the twitter api does not respect the count parameter so randomly sorting and slicing
    const trimmedTweets =
      cleanedTweets.length > count
        ? cleanedTweets.sort((_a, _b) => Math.random() - 0.5).slice(0, count)
        : cleanedTweets;
    return trimmedTweets;
  };

  const userId = await scraper.getUserIdByScreenName(username);

  return {
    scraper,
    username: username,
    userId: userId,
    getMyUnrepliedToMentions: (
      maxResults: number,
      maxThreadDepth: number = 5,
      ignoreConversationIds: string[] = [],
      sinceId?: string,
    ) =>
      getMyUnrepliedToMentions(
        scraper,
        username,
        maxThreadDepth,
        ignoreConversationIds,
        maxResults,
        sinceId,
      ),

    getFollowingRecentTweets: (maxResults: number = 100, randomNumberOfUsers: number = 10) =>
      getFollowingRecentTweets(scraper, username, maxResults, randomNumberOfUsers),

    isLoggedIn: () => scraper.isLoggedIn(),

    getProfile: async (username: string) => {
      const profile = await scraper.getProfile(username);
      if (!profile) {
        throw new Error(`Profile not found: ${username}`);
      }
      return profile;
    },

    getMyProfile: async () => await scraper.getProfile(username),

    getTweet: async (tweetId: string) => scraper.getTweet(tweetId),

    getRecentTweets: async (username: string, limit: number = 100) => {
      const userId = await scraper.getUserIdByScreenName(username);
      return await iterateResponse(scraper.getTweetsByUserId(userId, limit));
    },

    getMyRecentTweets: async (limit: number = 10) =>
      await iterateResponse(
        scraper.getTweetsByUserId(await scraper.getUserIdByScreenName(username), limit),
      ),

    getMyRepliedToIds: async () => Array.from(await getUserReplyIds(scraper, username, 100)),

    getFollowing: async (username: string, limit: number = 100) => {
      const userId = await scraper.getUserIdByScreenName(username);
      return await iterateResponse(scraper.getFollowing(userId, limit));
    },

    getMyTimeline: async (count: number, excludeIds: string[]) =>
      cleanTimelineTweets(await scraper.fetchHomeTimeline(count, excludeIds), count),

    getFollowingTimeline: async (count: number, excludeIds: string[]) =>
      cleanTimelineTweets(await scraper.fetchFollowingTimeline(count, excludeIds), count),

    getMyRecentReplies: (limit: number = 10) => getMyRecentReplies(scraper, username, limit),

    searchTweets: async (query: string, count: number = 25) =>
      await iterateResponse(scraper.searchTweets(query, count, SearchMode.Latest)),

    sendTweet: async (text: string, inReplyTo?: string) => {
      // Send the tweet and wait for it to complete
      if (text.length > 280) {
        await scraper.sendLongTweet(text, inReplyTo);
      } else {
        await scraper.sendTweet(text, inReplyTo);
      }

      const tweetId = await findTweetId(scraper, text, username);
      if (tweetId) {
        logger.info('Tweet sent and ID confirmed', { text, inReplyTo, id: tweetId });
        return tweetId;
      }

      logger.warn('Tweet sent but ID could not be confirmed', { text, inReplyTo });
      return '';
    },

    quoteTweet: async (text: string, quoteTweetId: string) => {
      await scraper.sendQuoteTweet(text, quoteTweetId);
      const tweetId = await findTweetId(scraper, text, username);
      if (tweetId) {
        logger.info('Tweet sent and ID confirmed', { text, quoteTweetId, id: tweetId });
        return tweetId;
      }

      logger.warn('Tweet sent but ID could not be confirmed', { text, quoteTweetId });
      return '';
    },

    likeTweet: async (tweetId: string) => {
      await scraper.likeTweet(tweetId);
    },

    followUser: async (username: string) => {
      //TODO: agent-twitter-client has misleading param documentation, username should be used
      await scraper.followUser(username);
    },
  };
};
