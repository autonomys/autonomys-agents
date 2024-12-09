import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { updateResponseStatus, getAllPendingResponses } from '../../services/database/index.js';
import { createTwitterClientScraper } from '../../services/twitter/api.js';
import { initializeDatabase, addDsn, isKOLExists, addKOL } from '../../database/index.js';
import { createAutoDriveApi, uploadFile } from '@autonomys/auto-drive';
import { v4 as generateId } from 'uuid';
import { config } from '../../config/index.js';
import { getUserProfile } from '../../utils/twitter.js';
import { ApprovalAction } from '../../types/queue.js';

const router = Router();
const logger = createLogger('responses-api');
const dsnAPI = createAutoDriveApi({ apiKey: config.DSN_API_KEY! });
const twitterScraper = await createTwitterClientScraper();

router.get('/responses/pending', async (_, res) => {
    const pendingResponses = await getAllPendingResponses();
    res.json(pendingResponses);
});

router.post('/responses/:id/approve', async (req, res) => {
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
            // check if the tweet.author_username exists in KOL table
            if(!(await isKOLExists(updatedResponse.tweet.author_username))) {
                logger.info('KOL not found, skipping DSN upload', {
                    username: updatedResponse.tweet.author_username
                });
                //add to KOL table
                await addKOL(await getUserProfile(updatedResponse.tweet.author_username));
                logger.info('KOL added to table', {
                    username: updatedResponse.tweet.author_username
                });

                // follow the KOL????? 
                await twitterScraper.followUser(updatedResponse.tweet.author_username);
                logger.info('Followed KOL', {
                    username: updatedResponse.tweet.author_username
                });
            }

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

router.get('/responses/:id/workflow', async (req, res) => {
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


export default router;