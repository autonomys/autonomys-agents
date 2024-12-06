import express from 'express';
import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { getAllPendingResponses, updateResponseStatus, getAllSkippedTweets, getSkippedTweet, moveToQueue } from './services/queue/index.js';
import { runWorkflow } from './services/agents/workflow.js';
import { createTwitterClient, replyToTweet } from './services/twitter/api.js';
import { initializeSchema, initializeDefaultKOLs } from './database/index.js';
import { ChromaService } from './services/vectorstore/chroma.js';
import { uploadFileFromFilepath, createAutoDriveApi, uploadFile } from '@autonomys/auto-drive'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger('app');
const dsnAPI = createAutoDriveApi({ apiKey: config.DSN_API_KEY! })
const options = {
    password: '',
    compression: true
}
// const filePath = join(__dirname, '../file.txt')

const app = express();

// Initialize Twitter client
const initializeTwitterClient = async () => {
    try {
        return await createTwitterClient({
            appKey: config.TWITTER_API_KEY!,
            appSecret: config.TWITTER_API_SECRET!,
            accessToken: config.TWITTER_ACCESS_TOKEN!,
            accessSecret: config.TWITTER_ACCESS_SECRET!
        });
    } catch (error) {
        logger.error('Failed to initialize Twitter client:', error);
        throw error;
    }
};

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
    app.get('/responses/pending', (_, res) => {
        const pendingResponses = getAllPendingResponses();
        res.json(pendingResponses);
    });

    // Approve/reject a response
    app.post('/responses/:id/approve', async (req, res) => {
        // UPON APPROVAL IT SHOULD ALSO GOES ONCHAIN
        try {
            const { approved, feedback } = req.body;
            const action = {
                id: req.params.id,
                approved,
                feedback
            };

            const updatedResponse = await updateResponseStatus(action);
            if (!updatedResponse) {
                return res.status(404).json({ error: 'Response not found' });
            }

            if (updatedResponse.status === 'approved') {
                logger.info('Creating Twitter client for approved response');
                const client = await initializeTwitterClient();

                logger.info('Sending reply:', {
                    tweetId: updatedResponse.tweet.id,
                    content: updatedResponse.response.content
                });

                await replyToTweet(
                    client,
                    updatedResponse.tweet.id,
                    updatedResponse.response.content
                );

                logger.info('Response sent successfully', {
                    tweetId: updatedResponse.tweet.id,
                    responseId: updatedResponse.id
                });
            }

            res.json(updatedResponse);
        } catch (error) {
            logger.error('Error handling response approval:', error);
            res.status(500).json({ error: 'Failed to process approval' });
        }
    });

    // Get workflow state for a response
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

    // Move skipped tweet to response queue
    app.post('/tweets/skipped/:id/queue', async (req, res) => {
        try {
            const skipped = getSkippedTweet(req.params.id);
            if (!skipped) {
                return res.status(404).json({ error: 'Skipped tweet not found' });
            }

            const { response } = req.body;
            if (!response) {
                return res.status(400).json({ error: 'Response is required' });
            }

            const queuedResponse = await moveToQueue(skipped.id, {
                id: skipped.id,
                tweet: skipped.tweet,
                response: {
                    content: response.content,
                    references: response.references
                },
                workflowState: skipped.workflowState,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'pending'
            });

            res.json(queuedResponse);
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
        // const uploadObservable = uploadFileFromFilepath(dsnAPI, filePath, options)
        // uploadObservable.subscribe({
        //     next: (status) => {
        //         console.log('File upload progress:', status)
        //     },
        //     error: (error) => {
        //         console.error('Error uploading file:', error)
        //     }
        //     })
        const chromaService = await ChromaService.getInstance();
        // TODO: Remove this after testing
        await chromaService.addSampleTweet();
        logger.info('ChromaDB initialized successfully');

        await initializeSchema();
        await initializeDefaultKOLs();
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