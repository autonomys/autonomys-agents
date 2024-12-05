import { TwitterApi, TweetV2, TwitterApiReadWrite, UserV2 } from 'twitter-api-v2';
import { TwitterCredentials, Tweet } from '../../types/twitter';
import { createLogger } from '../../utils/logger';
import { getLatestTweetTimestampByAuthor } from '../../database';
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
        // Create client with user authentication
        const client = new TwitterApi({
            appKey: credentials.appKey,
            appSecret: credentials.appSecret,
            accessToken: credentials.accessToken,
            accessSecret: credentials.accessSecret,
        });

        logger.info('Creating Twitter client with user auth');
        return client.readWrite;
    } catch (error) {
        logger.error('Failed to create Twitter client:', error);
        throw error;
    }
};

export const searchTweets = async (
    client: TwitterApiReadWrite,
    accounts: readonly string[],
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
                const latestTimestamp = (await getLatestTweetTimestampByAuthor(account));
                // add 1 second buffer
                const adjustedTimestamp = latestTimestamp ? new Date(new Date(latestTimestamp).getTime() + 1000).toISOString() : null;
                logger.info(`Searching tweets for account: ${account}, since ${adjustedTimestamp || 'default 3 days'}`);
                
                const query = `from:${account}`;
                const startTime = adjustedTimestamp || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

                const tweets = await client.v2.search(query, {
                    'tweet.fields': ['author_id', 'created_at', 'text', 'referenced_tweets'],
                    'user.fields': ['username', 'name'],
                    'expansions': ['author_id', 'referenced_tweets.id'],
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
                        const referencedTweet = tweet.referenced_tweets?.[0];
                        const fullText = referencedTweet?.type === 'retweeted' ?
                            tweets.includes?.tweets?.find(t => t.id === referencedTweet.id)?.text || tweet.text :
                            tweet.text;

                        return {
                            id: tweet.id,
                            text: fullText,
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
        try {
            logger.info('Attempting to reply to tweet:', {
                tweetId,
                content,
                hasClient: !!client,
            });

            // Try using createTweet instead of reply
            const result = await client.v2.tweet({
                text: content,
                reply: {
                    in_reply_to_tweet_id: tweetId
                }
            });

            logger.info(`Successfully replied to tweet: ${tweetId}`, { result });
        } catch (error: any) {
            logger.error('Failed to reply to tweet:', {
                tweetId,
                content,
                error: error.data || error,
                status: error.status,
                code: error.code,
                headers: error.headers
            });
            throw error;
        }
    });
}; 