import express from 'express';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { config } from './config';
import { createTwitterClient, searchTweets, replyToTweet } from './services/twitter/api';
import { handleTweet } from './services/agents/agent';
import { createLogger } from './utils/logger';
import { addToQueue, getAllPendingResponses, updateResponseStatus } from './services/queue';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('app');
const app = express();

let lastProcessedTweetId: string | undefined;

const pollTweets = async (client: TwitterApiReadWrite) => {
    try {
        const tweets = await searchTweets(client, config.TARGET_ACCOUNTS, lastProcessedTweetId);

        for (const tweet of tweets) {
            try {
                const response = await handleTweet(tweet);

                addToQueue({
                    id: uuidv4(),
                    tweet,
                    response,
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                logger.info('Response queued for approval');

                // Update last processed tweet ID
                if (!lastProcessedTweetId || tweet.id > lastProcessedTweetId) {
                    lastProcessedTweetId = tweet.id;
                }
            } catch (error) {
                logger.error('Error handling tweet:', error);
            }
        }
    } catch (error) {
        logger.error('Error polling tweets:', error);
    }
};

const startPolling = async () => {
    try {
        const client = await createTwitterClient({
            appKey: config.TWITTER_API_KEY!,
            appSecret: config.TWITTER_API_SECRET!
        });

        // Initial poll
        await pollTweets(client);

        // Set up polling interval
        setInterval(() => pollTweets(client), config.CHECK_INTERVAL);

        logger.info('Tweet polling started successfully');
        return client;
    } catch (error) {
        logger.error('Failed to start tweet polling:', error);
        throw error;
    }
};

const startServer = () => {
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_, res) => {
        res.json({ status: 'ok' });
    });

    // Get all pending responses
    app.get('/responses/pending', (_, res) => {
        const pendingResponses = getAllPendingResponses();
        res.json(pendingResponses);
    });

    // Approve/reject a response
    app.post('/responses/approve', (req, res) => {
        (async () => {
            try {
                const action = req.body;
                const updatedResponse = updateResponseStatus(action);

                if (!updatedResponse) {
                    return res.status(404).json({ error: 'Response not found' });
                }

                if (updatedResponse.status === 'approved') {
                    const client = await createTwitterClient({
                        appKey: config.TWITTER_API_KEY!,
                        appSecret: config.TWITTER_API_SECRET!
                    });

                    await replyToTweet(
                        client,
                        updatedResponse.tweet.id,
                        updatedResponse.response.content
                    );

                    logger.info(`Approved response sent for tweet: ${updatedResponse.tweet.id}`);
                }

                res.json(updatedResponse);
            } catch (error) {
                logger.error('Error handling approval:', error);
                res.status(500).json({ error: 'Failed to process approval' });
            }
        })();
    });

    app.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`);
    });
};

const main = async () => {
    try {
        await startPolling();
        startServer();
        logger.info('Application started successfully');
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

main(); 