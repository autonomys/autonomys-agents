import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from '../../config/index.js';

const logger = createLogger('agent-twitter-api');

export class ExtendedScraper extends Scraper {
  private static instance: ExtendedScraper | null = null;
  private conversationCache: Map<string, Tweet[]> = new Map();

  private constructor() {
    super();
  }

  public static async getInstance(): Promise<ExtendedScraper> {
    if (!ExtendedScraper.instance) {
      ExtendedScraper.instance = new ExtendedScraper();
      await ExtendedScraper.instance.initialize();
    }
    return ExtendedScraper.instance;
  }

  private async initialize() {
    const username = config.TWITTER_USERNAME!;
    const password = config.TWITTER_PASSWORD!;
    const cookiesPath = 'cookies.json';

    if (existsSync(cookiesPath)) {
      logger.info('Loading existing cookies');
      const cookies = readFileSync(cookiesPath, 'utf8');
      try {
        const parsedCookies = JSON.parse(cookies).map(
          (cookie: any) =>
            `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`,
        );
        await this.setCookies(parsedCookies);
        logger.info('Loaded existing cookies from file');
      } catch (error) {
        logger.error('Error loading cookies:', error);
      }
    } else {
      logger.info('No existing cookies found, proceeding with login');
      await this.login(username, password);

      const newCookies = await this.getCookies();
      writeFileSync(cookiesPath, JSON.stringify(newCookies, null, 2));
      logger.info('New cookies saved to file');
    }

    const isLoggedIn = await this.isLoggedIn();
    logger.info(`Login status: ${isLoggedIn}`);
  }

  private async reAuthenticate(maxRetries: number = 3): Promise<boolean> {
    let isLoggedIn = false;
    let retryCount = 0;

    while (!isLoggedIn && retryCount < maxRetries) {
      logger.warn(`Attempting to re-authenticate... (attempt ${retryCount + 1}/${maxRetries})`);
      try {
        await this.initialize();
        isLoggedIn = await this.isLoggedIn();
        if (isLoggedIn) {
          logger.info('Successfully re-authenticated');
          return true;
        }
        logger.error('Re-authentication failed');
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = 2000 * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        logger.error('Error during re-authentication:', error);
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = 2000 * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`Failed to re-authenticate after ${maxRetries} attempts`);
    return false;
  }

  async getMyMentions(maxResults: number = 100, sinceId?: string) {
    const username = config.TWITTER_USERNAME!;

    const isLoggedIn = await this.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('Must be logged in to fetch mentions');
    }

    const query = `@${username} -from:${username}`;
    const replies: Tweet[] = [];

    const searchIterator = this.searchTweets(query, maxResults, SearchMode.Latest);

    for await (const tweet of searchIterator) {
      logger.info('Checking tweet:', {
        id: tweet.id,
        text: tweet.text,
        author: tweet.username,
      });

      if (sinceId && tweet.id && tweet.id <= sinceId) {
        break;
      }

      const hasReplies = this.searchTweets(
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
  }

  public async getThread(tweetId: string): Promise<Tweet[]> {
    if (!(await this.isLoggedIn())) {
      const reAuthenticate = await this.reAuthenticate();
      if (!reAuthenticate) {
        logger.error('Failed to re-authenticate');
        return [];
      }
    }

    const initialTweet = await this.getTweet(tweetId);
    logger.info('Initial tweet fetched:', {
      id: initialTweet?.id,
    });

    if (!initialTweet) {
      logger.warn(`Tweet ${tweetId} not found or deleted`);
      return [];
    }

    const conversationId = initialTweet.conversationId || initialTweet.id;

    // Check cache first
    const cachedConversation = this.conversationCache.get(conversationId!);
    if (cachedConversation) {
      logger.info(
        `Returning cached conversation with ${cachedConversation.length} tweets for conversation_id:${conversationId}`,
      );
      return cachedConversation;
    }

    const conversationTweets = new Map<string, Tweet>();
    let rootTweet = initialTweet;

    // If the conversation root differs
    if (initialTweet.conversationId && initialTweet.conversationId !== initialTweet.id) {
      const conversationRoot = await this.getTweet(initialTweet.conversationId);
      if (conversationRoot) {
        rootTweet = conversationRoot;
        conversationTweets.set(rootTweet.id!, rootTweet);
        logger.info('Found conversation root tweet:', {
          id: rootTweet.id,
          conversationId: rootTweet.conversationId,
        });
      }
    } else {
      conversationTweets.set(rootTweet.id!, rootTweet);
    }

    try {
      logger.info('Fetching entire conversation via `conversation_id`:', conversationId);

      const conversationIterator = this.searchTweets(
        `conversation_id:${conversationId}`,
        100,
        SearchMode.Latest,
      );
      for await (const tweet of conversationIterator) {
        conversationTweets.set(tweet.id!, tweet);
      }
    } catch (error) {
      logger.warn(`Error fetching conversation: ${error}`);
      return [rootTweet, initialTweet];
    }

    // Convert to array and sort chronologically
    const thread = Array.from(conversationTweets.values());
    thread.sort((a, b) => {
      const timeA = a.timeParsed?.getTime() || 0;
      const timeB = b.timeParsed?.getTime() || 0;
      return timeA - timeB;
    });

    logger.info(
      `Retrieved conversation thread with ${thread.length} tweets for conversation_id:${conversationId}`,
    );

    // Save to cache
    this.conversationCache.set(conversationId!, thread);

    return thread;
  }

  // Placeholder for efficient thread fetching
  async getThreadPlaceHolder(tweetId: string, maxDepth: number = 100): Promise<Tweet[]> {
    const username = config.TWITTER_USERNAME!;
    const isLoggedIn = await this.isLoggedIn();
    if (!isLoggedIn) {
      const reAuthenticate = await this.reAuthenticate();
      if (!reAuthenticate) {
        logger.error('Failed to re-authenticate');
        return [];
      }
    }

    try {
      const thread: Tweet[] = [];
      const seen = new Set<string>();
      const conversationTweets = new Map<string, Tweet>();

      const initialTweet = await this.getTweet(tweetId);
      if (!initialTweet) {
        logger.warn(`Tweet ${tweetId} not found or deleted`);
        return [];
      }

      let rootTweet = initialTweet;
      const conversationId = initialTweet.conversationId || initialTweet.id;

      logger.info('Initial tweet:', {
        id: initialTweet.id,
        conversationId: conversationId,
        inReplyToStatusId: initialTweet.inReplyToStatusId,
      });

      if (initialTweet.conversationId && initialTweet.conversationId !== initialTweet.id) {
        const conversationRoot = await this.getTweet(initialTweet.conversationId);
        if (conversationRoot) {
          rootTweet = conversationRoot;
          conversationTweets.set(rootTweet.id!, rootTweet);
          logger.info('Found root tweet:', {
            id: rootTweet.id,
            conversationId: rootTweet.conversationId,
          });
        }
      }

      try {
        logger.info('Fetching conversation with query:', `conversation_id:${conversationId}`);
        const conversationIterator = this.searchTweets(
          `conversation_id:${conversationId}`,
          100,
          SearchMode.Latest,
        );

        for await (const tweet of conversationIterator) {
          conversationTweets.set(tweet.id!, tweet);
          logger.info('Found conversation tweet:', {
            id: tweet.id,
            inReplyToStatusId: tweet.inReplyToStatusId,
            text: tweet.text?.substring(0, 50) + '...',
          });
        }

        logger.info('Total conversation tweets found:', conversationTweets.size);
      } catch (error) {
        logger.warn(`Error fetching conversation: ${error}`);
        return [rootTweet, initialTweet];
      }

      thread.push(...conversationTweets.values());
      thread.sort((a, b) => {
        const timeA = a.timeParsed?.getTime() || 0;
        const timeB = b.timeParsed?.getTime() || 0;
        return timeA - timeB;
      });

      logger.info(`Retrieved thread with ${thread.length} tweets`);
      return thread;
    } catch (error) {
      logger.error(`Unexpected error in getThread: ${error}`);
      return [];
    }
  }
}

export const createTwitterClientScraper = async () => {
  return ExtendedScraper.getInstance();
};
