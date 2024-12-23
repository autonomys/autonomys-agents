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
                const parsedCookies = JSON.parse(cookies).map((cookie: any) =>
                    `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`
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
                author: tweet.username
            });

            if (sinceId && tweet.id && tweet.id <= sinceId) {
                break;
            }

            const hasReplies = await this.searchTweets(
                `from:${username} to:${tweet.username}`,
                10,
                SearchMode.Latest
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

    async getThread(tweetId: string, maxDepth: number = 100): Promise<Tweet[]> {
        // First check login status
        let isLoggedIn = await this.isLoggedIn();
        
        // If not logged in, attempt to re-authenticate
        if (!isLoggedIn) {
            logger.warn('Session expired, attempting to re-authenticate...');
            try {
                await this.initialize();
                isLoggedIn = await this.isLoggedIn();
                if (!isLoggedIn) {
                    logger.error('Re-authentication failed');
                    return []; // Return empty array instead of throwing
                }
                logger.info('Successfully re-authenticated');
            } catch (error) {
                logger.error('Error during re-authentication:', error);
                return []; // Return empty array instead of throwing
            }
        }

        try {
            const thread: Tweet[] = [];
            const seen = new Set<string>();

            // Get the initial tweet
            const initialTweet = await this.getTweet(tweetId);
            if (!initialTweet) {
                logger.warn(`Tweet ${tweetId} not found or deleted`);
                return [];
            }

            // Fetch all conversation tweets in one query
            const conversationTweets = new Map<string, Tweet>();
            try {
                const conversationIterator = this.searchTweets(
                    `conversation_id:${initialTweet.conversationId}`,
                    100,
                    SearchMode.Latest
                );

                for await (const tweet of conversationIterator) {
                    conversationTweets.set(tweet.id!, tweet);
                }
            } catch (error) {
                logger.warn(`Error fetching conversation: ${error}`);
                return [initialTweet]; // Return at least the initial tweet if we can't get the conversation
            }

            // Build the thread by following reply chains
            const buildThread = (tweet: Tweet) => {
                if (seen.has(tweet.id!)) return;
                seen.add(tweet.id!);
                thread.push(tweet);

                // Find direct replies to this tweet from our conversation map
                for (const [, potentialReply] of conversationTweets) {
                    if (potentialReply.inReplyToStatusId === tweet.id) {
                        buildThread(potentialReply);
                    }
                }
            };

            // Find the root tweet by following the reply chain up
            let rootTweet = initialTweet;
            while (rootTweet.inReplyToStatusId) {
                const parentTweet = conversationTweets.get(rootTweet.inReplyToStatusId);
                if (!parentTweet) break;
                rootTweet = parentTweet;
            }

            // Build thread starting from root
            buildThread(rootTweet);

            // Sort chronologically
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