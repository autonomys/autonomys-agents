import express from 'express';
import { writerAgent } from '../services/writerAgent';
import logger from '../logger';

const router = express.Router();

router.post('/', (req, res, next) => {
    logger.info('Received request to start new draft:', req.body);
    (async () => {
        try {
            const { category, topic, contentType, otherInstructions } = req.body;

            if (!category || !topic || !contentType) {
                logger.warn('Missing required fields');
                return res.status(400).json({ error: 'Category, topic, and contentType are required' });
            }

            const result = await writerAgent.startDraft({
                category,
                topic,
                contentType,
                otherInstructions,
            });

            res.json({
                threadId: result.threadId,
                finalContent: result.finalContent,
                research: result.research,
                reflections: result.reflections,
                drafts: result.drafts,
                feedbackHistory: result.feedbackHistory,
            });
        } catch (error) {
            logger.error('Error in writer endpoint:', error);
            next(error);
        }
    })();
});

router.post('/:threadId/feedback', (req, res, next) => {
    logger.info('Received feedback request:', req.body);
    (async () => {
        try {
            const { feedback } = req.body;
            const threadId = req.params.threadId;

            if (!feedback) {
                return res.status(400).json({ error: 'Feedback is required' });
            }

            logger.info('Processing feedback for thread:', threadId);

            const result = await writerAgent.continueDraft({
                threadId,
                feedback,
            });

            res.json({
                content: result.finalContent
            });
        } catch (error) {
            logger.error('Error in feedback endpoint:', error);
            next(error);
        }
    })();
});

export const writerRouter = router;
