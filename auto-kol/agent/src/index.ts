import express, { response } from 'express';
import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runWorkflow } from './services/agents/workflow.js';
import { updateResponseStatus, getAllPendingResponses, getSkippedTweets, getSkippedTweetById } from './services/database/index.js';
import { createTwitterClientScraper } from './services/twitter/api.js';
import { initializeSchema, initializeDefaultKOLs, initializeDatabase, addDsn, recheckSkippedTweet } from './database/index.js';
import { createAutoDriveApi, uploadFile } from '@autonomys/auto-drive'
import { v4 as generateId } from 'uuid';
import { ApprovalAction } from './types/queue.js';
import cors from 'cors'
import { SearchMode } from 'agent-twitter-client';
import { updateKOLs } from './utils/twitter.js';

const logger = createLogger('app');
const dsnAPI = createAutoDriveApi({ apiKey: config.DSN_API_KEY! })

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

// Initialize Twitter client
const twitterScraper = await createTwitterClientScraper();

// Run workflow periodically
const startWorkflowPolling = async () => {
    try {
        await runWorkflow();
        logger.info('Workflow execution completed successfully');
    } catch (error) {
        logger.error('Error running workflow:', error);
    }
};

const startServer = () => {
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_, res) => {
        res.json({ status: 'ok' });
    });

    // Get all pending responses
    app.get('/responses/pending', async (_, res) => {
        const pendingResponses = await getAllPendingResponses();
        res.json(pendingResponses);
    });

    // Approve/reject a response
    app.post('/responses/:id/approve', async (req, res) => {
        try {
            const { approved, feedback } = req.body;
            const action: ApprovalAction = {
                id: req.params.id,
                approved,
                feedback
            };
            logger.info('Approving response:', {
                id: action.id,
                approved: action.approved,
                feedback: action.feedback
            });

            const updatedResponse = await updateResponseStatus(action);
            if (!updatedResponse) {
                return res.status(404).json({ error: 'Response not found' });
            }

            if (updatedResponse.status === 'approved') {

                const twitterResponse: Response = await twitterScraper.sendTweet(
                    updatedResponse.response.content,
                    updatedResponse.tweet.id
                );
                const responseData = await twitterResponse.json()

                const tweetId = responseData.data?.create_tweet?.tweet_results?.result?.rest_id
                logger.info('tweetId', tweetId)

                // Upload to DSN
                const db = await initializeDatabase();

                const previousDsn = await db.get(`
                    SELECT dsn.cid 
                    FROM dsn
                    JOIN tweets ON dsn.tweet_id = tweets.id
                    WHERE kol_username = ?
                    ORDER BY dsn.created_at DESC 
                    LIMIT 1
                `, [updatedResponse.tweet.author_username]) || { cid: null };

                const dsnData = {
                    previousCid: previousDsn?.cid || null,
                    updatedResponse,
                    tweetId,
                    feedback: feedback || null,
                    timestamp: new Date().toISOString()
                };

                const jsonBuffer = Buffer.from(JSON.stringify(dsnData, null, 2));
                const uploadObservable = uploadFile(
                    dsnAPI,
                    {
                        read: async function* () {
                            yield jsonBuffer;
                        },
                        name: `${updatedResponse.tweet.id}.json`,
                        mimeType: 'application/json',
                        size: jsonBuffer.length,
                        path: updatedResponse.tweet.id
                    },
                    { compression: true }
                );

                // Wait for upload to complete and get CID
                let finalCid: string | undefined;
                await uploadObservable.forEach(status => {
                    if (status.type === 'file' && status.cid) {
                        finalCid = status.cid.toString();
                    }
                });

                if (!finalCid) {
                    throw new Error('Failed to get CID from DSN upload');
                }
                await addDsn({
                    id: generateId(),
                    tweetId: updatedResponse.tweet.id,
                    kolUsername: updatedResponse.tweet.author_username,
                    cid: finalCid,
                    responseId: updatedResponse.response.id
                });

                logger.info('Response uploaded to DSN successfully', {
                    tweetId: updatedResponse.tweet.id,
                    responseId: updatedResponse.response.id,
                    cid: finalCid
                });
            }

            res.json(updatedResponse);
        } catch (error) {
            logger.error('Error handling response approval:', error);
            res.status(500).json({ error: 'Failed to process approval' });
        }
    });

    // Get workflow state for a response
    app.get('/responses/:id/workflow', async (req, res) => {
        try {
            const responses = await getAllPendingResponses();
            const response = responses.find(r => r.id === req.params.id);
            if (!response) {
                return res.status(404).json({ error: 'Response not found' });
            }
            res.json(response.workflowState);
        } catch (error) {
            logger.error('Error getting workflow state:', error);
            res.status(500).json({ error: 'Failed to get workflow state' });
        }
    });

    // Get all skipped tweets
    app.get('/tweets/skipped', async (_, res) => {
        const skippedTweets = await getSkippedTweets();
        res.json(skippedTweets);
    });

    // Get specific skipped tweet
    app.get('/tweets/skipped/:id', async (req, res) => {
        const skipped = await getSkippedTweetById(req.params.id);
        if (!skipped) {
            return res.status(404).json({ error: 'Skipped tweet not found' });
        }
        res.json(skipped);
    });

    app.post('/tweets/skipped/:id/queue', async (req, res) => {
        try {
            logger.info(`Received request to move skipped tweet to queue: ${req.params.id}`);
            const skipped = await getSkippedTweetById(req.params.id);
            if (!skipped) {
                return res.status(404).json({ error: 'Skipped tweet not found' });
            }
            const recheck = await recheckSkippedTweet(req.params.id);
            if (!recheck) {
                return res.status(404).json({ error: 'Failed to recheck skipped tweet' });
            }
            res.json({
                message: 'Skipped tweet rechecked and moved to queue - if will be processed in next workflow run'
            });
        } catch (error) {
            logger.error('Error moving skipped tweet to queue:', error);
            res.status(500).json({ error: 'Failed to move tweet to queue' });
        }
    });

    // Start server
    app.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`);
    });
};

// Main application startup
const main = async () => {
    try {
        await initializeSchema();
        // await initializeDefaultKOLs();
        // Initialize server
        startServer();

        // Start periodic workflow execution
        await startWorkflowPolling();
        setInterval(startWorkflowPolling, config.CHECK_INTERVAL);

        logger.info('Application started successfully', {
            checkInterval: config.CHECK_INTERVAL,
            port: config.PORT
        });
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

main(); 