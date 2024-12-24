import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from '../../config/index.js';

const logger = createLogger('agent-twitter-api');

export class ExtendedScraper extends Scraper {
  private static instance: ExtendedScraper | null = null;

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

      const hasReplies = await this.searchTweets(
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

  async getThread(tweetId: string): Promise<Tweet[]> {
    const username = config.TWITTER_USERNAME!;
    const isLoggedIn = await this.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('Must be logged in to fetch thread');
    }

    const thread: Tweet[] = [];
    const seen = new Set<string>();

    const initialTweet = await this.getTweet(tweetId);
    if (!initialTweet) {
      throw new Error(`Tweet ${tweetId} not found`);
    }

    let currentTweet = initialTweet;
    while (currentTweet.inReplyToStatusId) {
      const parentTweet = await this.getTweet(currentTweet.inReplyToStatusId);
      if (!parentTweet) break;
      if (!seen.has(parentTweet.id!)) {
        thread.push(parentTweet);
        seen.add(parentTweet.id!);
      }
      currentTweet = parentTweet;
    }

    if (!seen.has(initialTweet.id!)) {
      thread.push(initialTweet);
      seen.add(initialTweet.id!);
    }

    const agentTweet = thread.find(t => t.username === username);
    if (agentTweet) {
      const replies = this.searchTweets(
        `conversation_id:${currentTweet.id!} in_reply_to_tweet_id:${agentTweet.id!}`,
        100,
        SearchMode.Latest,
      );

      for await (const reply of replies) {
        if (!seen.has(reply.id!)) {
          thread.push(reply);
          seen.add(reply.id!);
        }
      }
    }

    // Sort chronologically
    thread.sort((a, b) => {
      const timeA = a.timeParsed?.getTime() || 0;
      const timeB = b.timeParsed?.getTime() || 0;
      return timeA - timeB;
    });

    logger.info(
      `Retrieved conversation thread with ${thread.length} tweets starting from root tweet ${currentTweet.id!}`,
    );

    return thread;
  }
}

export const createTwitterClientScraper = async () => {
  return ExtendedScraper.getInstance();
};
