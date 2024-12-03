import { TwitterApi, TweetV2, TwitterApiReadWrite, UserV2 } from 'twitter-api-v2';
import { TwitterCredentials, Tweet } from '../../types/twitter';
import { createLogger } from '../../utils/logger';

const logger = createLogger('twitter-api');

// Rate limit handling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleRateLimit = async (error: any): Promise<void> => {
    if (error?.data?.status === 429) {
        const resetTime = error.rateLimit?.reset;
        if (resetTime) {
            const waitTime = (resetTime * 1000) - Date.now() + 1000; // Add 1s buffer
            logger.info(`Rate limited. Waiting ${waitTime}ms before retry`);
            await sleep(waitTime);
        } else {
            // If no reset time, wait 15 minutes
            logger.info('Rate limited. Waiting 15 minutes before retry');
            await sleep(15 * 60 * 1000);
        }
    } else {
        throw error;
    }
};

const withRateLimitRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            if (error?.data?.status === 429 && attempt < maxRetries) {
                await handleRateLimit(error);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
};

export const createTwitterClient = async (credentials: TwitterCredentials): Promise<TwitterApiReadWrite> => {
    try {
        const appOnlyClient = new TwitterApi({
            appKey: credentials.appKey,
            appSecret: credentials.appSecret
        });

        const bearerClient = await appOnlyClient.appLogin();
        logger.info('Successfully authenticated with Twitter API');
        return bearerClient;
    } catch (error) {
        logger.error('Failed to create Twitter client:', error);
        throw error;
    }
};

export const searchTweets = async (
    client: TwitterApiReadWrite,
    accounts: readonly string[],
    sinceId?: string
): Promise<Tweet[]> => {
    return withRateLimitRetry(async () => {
        try {
            if (!accounts || accounts.length === 0) {
                logger.error('No accounts provided for search');
                return [];
            }

            // Search for each account separately and combine results
            const allTweets: Tweet[] = [];

            for (const account of accounts) {
                logger.info(`Searching tweets for account: ${account}`);

                const query = `from:${account}`;
                const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                const tweets = await client.v2.search(query, {
                    'tweet.fields': ['author_id', 'created_at'],
                    'user.fields': ['username', 'name'],
                    'expansions': ['author_id'],
                    since_id: sinceId,
                    max_results: 10,
                    start_time: startTime
                });

                // Extract users from the includes
                const users = tweets.includes?.users || [];
                const userMap = new Map<string, UserV2>();
                users.forEach(user => {
                    if (user.id) {
                        userMap.set(user.id, user);
                    }
                });

                logger.info(`Found ${tweets.tweets.length} tweets for ${account}`);

                const accountTweets = tweets.tweets
                    .filter((tweet): tweet is TweetV2 & { author_id: string; created_at: string } => {
                        const isValid = tweet.author_id !== undefined && tweet.created_at !== undefined;
                        if (!isValid) {
                            logger.warn('Invalid tweet data:', { tweet });
                        }
                        return isValid;
                    })
                    .map((tweet) => {
                        const user = userMap.get(tweet.author_id);
                        if (!user) {
                            logger.warn('No user found for tweet:', {
                                tweetId: tweet.id,
                                authorId: tweet.author_id
                            });
                        }

                        return {
                            id: tweet.id,
                            text: tweet.text,
                            authorId: tweet.author_id,
                            authorUsername: user?.username || "unknown",
                            createdAt: tweet.created_at
                        };
                    });

                allTweets.push(...accountTweets);
            }

            // Sort all tweets by creation date (newest first)
            allTweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            logger.info('Combined tweet results:', {
                totalTweets: allTweets.length,
                accountsSearched: accounts
            });

            return allTweets;
        } catch (error: any) {
            logger.error('Error in searchTweets:', {
                errorMessage: error?.message || 'Unknown error',
                errorData: error?.data || {},
                errorType: error?.constructor?.name || 'Unknown',
                accounts,
                sinceId
            });
            throw error;
        }
    });
};

export const replyToTweet = async (
    client: TwitterApiReadWrite,
    tweetId: string,
    content: string
): Promise<void> => {
    return withRateLimitRetry(async () => {
        await client.v2.reply(content, tweetId);
        logger.info(`Successfully replied to tweet: ${tweetId}`);
    });
}; 