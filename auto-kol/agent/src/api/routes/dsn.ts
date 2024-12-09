import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { getDsnByTweetId, getAllDsn } from '../../database/index.js';

const router = Router();
const logger = createLogger('dsn-api');

router.get('/dsn', async (_, res) => {
    try {
        const dsnRecords = await getAllDsn();
        res.json(dsnRecords);
    } catch (error) {
        logger.error('Error fetching DSN records:', error);
        res.status(500).json({ error: 'Failed to fetch DSN records' });
    }
});

router.get('/dsn/:tweetId', async (req, res) => {
    try {
        const dsn = await getDsnByTweetId(req.params.tweetId);
        if (!dsn) {
            return res.status(404).json({ error: 'DSN record not found' });
        }
        res.json(dsn);
    } catch (error) {
        logger.error('Error fetching DSN record:', error);
        res.status(500).json({ error: 'Failed to fetch DSN record' });
    }
});

export default router; 