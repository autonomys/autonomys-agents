import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { getSkippedTweets, getSkippedTweetById } from '../../services/database/index.js';
import { recheckSkippedTweet } from '../../database/index.js';

const router = Router();
const logger = createLogger('tweets-api');

router.get('/tweets/skipped', async (_, res) => {
  const skippedTweets = await getSkippedTweets();
  res.json(skippedTweets);
});

router.get('/tweets/skipped/:id', async (req, res) => {
  const skipped = await getSkippedTweetById(req.params.id);
  if (!skipped) {
    return res.status(404).json({ error: 'Skipped tweet not found' });
  }
  res.json(skipped);
});

router.post('/tweets/skipped/:id/queue', async (req, res) => {
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
      message:
        'Skipped tweet rechecked and moved to queue - if will be processed in next workflow run',
    });
  } catch (error) {
    logger.error('Error moving skipped tweet to queue:', error);
    res.status(500).json({ error: 'Failed to move tweet to queue' });
  }
});

export default router;
