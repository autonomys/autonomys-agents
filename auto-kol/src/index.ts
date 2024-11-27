import express from 'express';
import { config } from './config';
import { createTwitterClient, setupTwitterStream } from './services/twitter/api';
import { handleTweet } from './services/agents/agent';
import { createLogger } from './utils/logger';

const logger = createLogger('app');
const app = express();

const startTwitterStream = async () => {
    try {
        const client = createTwitterClient({
            appKey: config.TWITTER_API_KEY!,
            appSecret: config.TWITTER_API_SECRET!,
            accessToken: config.TWITTER_ACCESS_TOKEN!,
            accessSecret: config.TWITTER_ACCESS_SECRET!
        });

        await setupTwitterStream(client, config.TARGET_ACCOUNTS);

        const stream = await client.v2.searchStream({
            'tweet.fields': ['author_id', 'created_at']
        });

        stream.on('data', async tweet => {
            try {
                const response = await handleTweet({
                    id: tweet.data.id,
                    text: tweet.data.text,
                    authorId: tweet.data.author_id,
                    createdAt: tweet.data.created_at
                });

                logger.info('Generated response:', {
                    tweetId: tweet.data.id,
                    response
                });
            } catch (error) {
                logger.error('Error handling tweet:', error);
            }
        });

        stream.on('error', error => {
            logger.error('Stream error:', error);
        });
    } catch (error) {
        logger.error('Failed to start Twitter stream:', error);
        throw error;
    }
};

const startServer = () => {
    app.use(express.json());

    app.get('/health', (_, res) => {
        res.json({ status: 'ok' });
    });

    app.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`);
    });
};

const main = async () => {
    try {
        await startTwitterStream();
        startServer();
        logger.info('Application started successfully');
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

main(); 