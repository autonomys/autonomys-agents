import express from 'express';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { config } from './config';
import { createTwitterClient, searchTweets, replyToTweet } from './services/twitter/api';
import { createLogger } from './utils/logger';
import { addToQueue, getAllPendingResponses, updateResponseStatus, getAllSkippedTweets, getSkippedTweet, moveToQueue, addToSkipped } from './services/queue';
import { runWorkflow } from './services/agents/workflow';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('app');
const app = express();

let lastProcessedTweetId: string | undefined;

const pollTweets = async (client: TwitterApiReadWrite) => {
    try {
        const tweets = await searchTweets(client, config.TARGET_ACCOUNTS, lastProcessedTweetId);

        for (const tweet of tweets) {
            try {
                const workflowResult = await runWorkflow(tweet);

                if (workflowResult.engagementDecision?.shouldEngage && workflowResult.selectedResponse) {
                    const sentiment = (() => {
                        const tone = workflowResult.toneAnalysis?.suggestedTone.toLowerCase() || '';
                        if (tone.includes('agree') || tone.includes('support')) return 'agree';
                        if (tone.includes('disagree') || tone.includes('counter')) return 'disagree';
                        return 'neutral';
                    })() as 'agree' | 'disagree' | 'neutral';

                    const queuedResponse = {
                        id: uuidv4(),
                        tweet,
                        response: {
                            content: workflowResult.selectedResponse.selectedResponse,
                            confidence: workflowResult.selectedResponse.confidence,
                            sentiment,
                            references: workflowResult.alternatives?.map(alt => alt.strategy) || []
                        },
                        status: 'pending' as const,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        workflowState: workflowResult
                    };

                    addToQueue(queuedResponse);
                    logger.info('Response queued for approval', {
                        tweetId: tweet.id,
                        queuedId: queuedResponse.id,
                        priority: workflowResult.engagementDecision.priority,
                        sentiment
                    });
                } else {
                    const skippedTweet = {
                        id: uuidv4(),
                        tweet,
                        reason: workflowResult.engagementDecision?.reason || 'No reason provided',
                        priority: workflowResult.engagementDecision?.priority || 0,
                        createdAt: new Date(),
                        workflowState: workflowResult
                    };

                    addToSkipped(skippedTweet);
                    logger.info('Tweet skipped', {
                        tweetId: tweet.id,
                        skippedId: skippedTweet.id,
                        reason: skippedTweet.reason
                    });
                }

                if (!lastProcessedTweetId || tweet.id > lastProcessedTweetId) {
                    lastProcessedTweetId = tweet.id;
                }
            } catch (error) {
                logger.error('Error processing tweet:', error);
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

                    logger.info('Approved response sent', {
                        tweetId: updatedResponse.tweet.id,
                        workflowState: updatedResponse.workflowState
                    });
                }

                res.json(updatedResponse);
            } catch (error) {
                logger.error('Error handling approval:', error);
                res.status(500).json({ error: 'Failed to process approval' });
            }
        })();
    });

    app.get('/responses/:id/workflow', (req, res) => {
        const response = getAllPendingResponses().find(r => r.id === req.params.id);
        if (!response) {
            return res.status(404).json({ error: 'Response not found' });
        }
        res.json(response.workflowState);
    });

    // Get all skipped tweets
    app.get('/tweets/skipped', (_, res) => {
        const skippedTweets = getAllSkippedTweets();
        res.json(skippedTweets);
    });

    // Get specific skipped tweet
    app.get('/tweets/skipped/:id', (req, res) => {
        const skipped = getSkippedTweet(req.params.id);
        if (!skipped) {
            return res.status(404).json({ error: 'Skipped tweet not found' });
        }
        res.json(skipped);
    });

    // Move skipped tweet to queue with new response
    app.post('/tweets/skipped/:id/queue', async (req, res) => {
        try {
            const skipped = getSkippedTweet(req.params.id);
            if (!skipped) {
                return res.status(404).json({ error: 'Skipped tweet not found' });
            }

            const queuedResponse = {
                id: uuidv4(),
                tweet: skipped.tweet,
                response: req.body.response,
                status: 'pending' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                workflowState: skipped.workflowState
            };

            await moveToQueue(skipped.id, queuedResponse);
            res.json(queuedResponse);
        } catch (error) {
            logger.error('Error moving skipped tweet to queue:', error);
            res.status(500).json({ error: 'Failed to move tweet to queue' });
        }
    });

    app.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`);
    });
};

const main = async () => {
    try {
        startServer();
        await startPolling();
        logger.info('Application started successfully');
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

main(); 