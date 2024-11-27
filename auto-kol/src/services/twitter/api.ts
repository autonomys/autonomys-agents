import { TwitterApi, TweetV2, TwitterApiReadWrite } from 'twitter-api-v2';
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
        const query = accounts.map(account => `from:${account}`).join(' OR ');

        const tweets = await client.v2.search(query, {
            'tweet.fields': ['author_id', 'created_at'],
            since_id: sinceId,
            max_results: 10
        });

        return tweets.tweets
            .filter((tweet): tweet is TweetV2 & { author_id: string; created_at: string } =>
                tweet.author_id !== undefined && tweet.created_at !== undefined)
            .map((tweet) => ({
                id: tweet.id,
                text: tweet.text,
                authorId: tweet.author_id,
                createdAt: tweet.created_at
            }));
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