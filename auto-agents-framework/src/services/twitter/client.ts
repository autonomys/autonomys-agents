import { Scraper, SearchMode, Tweet, Profile } from 'agent-twitter-client';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const logger = createLogger('twitter-api');

export interface TwitterAPI {
  scraper: Scraper;
  username: string;
  getMyMentions: (maxResults: number, sinceId?: string) => Promise<Tweet[]>;
  isLoggedIn: () => Promise<boolean>;
  getProfile: (username: string) => Promise<Profile>;
  getTweet: (tweetId: string) => Promise<Tweet | null>;
  getFollowing: (userId: string, limit: number) => Promise<Profile[]>;
  fetchHomeTimeline: (cursor: number, excludeIds: string[]) => Promise<Tweet[]>;
  searchTweets: (query: string, limit: number) => AsyncGenerator<Tweet>;
}

const loadCookies = async (scraper: Scraper, cookiesPath: string): Promise<void> => {
  logger.info('Loading existing cookies');
  const cookies = readFileSync(cookiesPath, 'utf8');
  try {
    const parsedCookies = JSON.parse(cookies).map(
      (cookie: any) =>
        `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`,
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

const getMyMentions = async (
  scraper: Scraper,
  username: string,
  maxResults: number = 50,
  sinceId?: string,
) => {
  const query = `@${username} -from:${username}`;
  const replies: Tweet[] = [];

  const searchIterator = scraper.searchTweets(query, maxResults, SearchMode.Latest);

  for await (const tweet of searchIterator) {
    logger.info('Checking tweet:', {
      id: tweet.id,
      text: tweet.text,
      author: tweet.username,
    });

    if (sinceId && tweet.id && tweet.id <= sinceId) {
      break;
    }

    const hasReplies = await scraper.searchTweets(
      `from:${username} to:${tweet.username}`,
      10,
      SearchMode.Latest,
    );

    let alreadyReplied = false;
    for await (const reply of hasReplies) {
      if (reply.inReplyToStatusId === tweet.id) {
        alreadyReplied = true;
        logger.info(`Skipping tweet ${tweet.id} - already replied with ${reply.id}`);
        break;
      }
    }

    if (!alreadyReplied) {
      replies.push(tweet);
    }

    if (replies.length >= maxResults) {
      break;
    }
  }

  return replies;
};

export const createTwitterAPI = async (
  username: string,
  password: string,
  cookiesPath: string = 'cookies.json',
): Promise<TwitterAPI> => {
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
    throw new Error('Failed to initialize Twitter API - not logged in');
  }

  return {
    scraper,
    username: username,
    getMyMentions: (maxResults: number, sinceId?: string) =>
      getMyMentions(scraper, username, maxResults, sinceId),

    isLoggedIn: () => scraper.isLoggedIn(),

    getProfile: async (username: string) => {
      const profile = await scraper.getProfile(username);
      if (!profile) {
        throw new Error(`Profile not found: ${username}`);
      }
      return profile;
    },

    getTweet: async (tweetId: string) => {
      return scraper.getTweet(tweetId);
    },

    getFollowing: async (userId: string, limit: number = 100) => {
      const following: Profile[] = [];
      const iterator = scraper.getFollowing(userId, limit);

      for await (const user of iterator) {
        following.push(user);
        if (following.length >= limit) break;
      }

      return following;
    },

    fetchHomeTimeline: async (count: number, excludeIds: string[]) => {
      const timelineTweets = await scraper.fetchHomeTimeline(count, excludeIds);

      return timelineTweets;
    },

    searchTweets: async function* (
      query: string,
      limit: number,
      mode: SearchMode = SearchMode.Latest,
    ) {
      const iterator = scraper.searchTweets(query, limit, mode);
      for await (const tweet of iterator) {
        yield tweet;
        if (--limit <= 0) break;
      }
    },
  };
};
