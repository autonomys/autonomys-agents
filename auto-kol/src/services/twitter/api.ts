import { TwitterApi, TweetV2, TwitterApiReadWrite } from 'twitter-api-v2';
import { TwitterCredentials, Tweet } from '../../types/twitter';
import { createLogger } from '../../utils/logger';

const logger = createLogger('twitter-api');

export const createTwitterClient = async (credentials: TwitterCredentials): Promise<TwitterApiReadWrite> => {
    try {
        // Create client with app credentials
        const appOnlyClient = new TwitterApi({
            appKey: credentials.appKey,
            appSecret: credentials.appSecret
        });

        // Get bearer token
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
    try {
        // Build query to search for tweets from specified accounts
        const query = accounts.map(account => `from:${account}`).join(' OR ');

        const tweets = await client.v2.search(query, {
            'tweet.fields': ['author_id', 'created_at'],
            since_id: sinceId,
            max_results: 10 // Adjust as needed
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
    } catch (error) {
        logger.error('Error searching tweets:', error);
        throw error;
    }
};

export const replyToTweet = async (
    client: TwitterApiReadWrite,
    tweetId: string,
    content: string
): Promise<void> => {
    try {
        await client.v2.reply(content, tweetId);
        logger.info(`Successfully replied to tweet: ${tweetId}`);
    } catch (error) {
        logger.error('Error replying to tweet:', error);
        throw error;
    }
}; 