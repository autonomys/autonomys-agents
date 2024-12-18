import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { updateResponseStatus, getAllPendingResponses } from '../../services/database/index.js';
import { createTwitterService } from '../../services/twitter/twitterService.js';
import { config } from '../../config/index.js';
import { ApprovalAction } from '../../types/queue.js';

const router = Router();
const logger = createLogger('responses-api');
const twitterService = await createTwitterService(config.TWITTER_CONFIG);

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

            const twitterResponse: Response = await twitterService.twitterAPI.scraper.sendTweet(
                updatedResponse.response.content,
                updatedResponse.tweet.id
            );
            const responseData = await twitterResponse.json()

            const tweetId = responseData.data?.create_tweet?.tweet_results?.result?.rest_id
            logger.info('tweetId', tweetId)

            // TODO. Should the log here also be uploaded to dsn?

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