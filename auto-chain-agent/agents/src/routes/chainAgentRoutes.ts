import express from 'express';
import { blockchainAgent } from '../services/chainAgent';
import logger from '../logger';

const router = express.Router();

router.post('/', (req, res, next) => {
  logger.info('Received blockchain request:', req.body);
  (async () => {
    try {
      const { message, threadId } = req.body;

      if (!message) {
        logger.warn('Missing message field');
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await blockchainAgent.handleMessage({
        message,
        threadId
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in blockchain endpoint:', error);
      next(error);
    }
  })();
});

router.get('/:threadId/state', (req, res, next) => {
  logger.info('Received request to get thread state:', req.params.threadId);
  (async () => {
    try {
      const threadId = req.params.threadId;
      const threadState = await blockchainAgent.getThreadState(threadId);

      if (!threadState) {
        return res.status(404).json({
          error: 'Thread not found'
        });
      }

      res.json({
        threadId,
        messages: threadState.state.messages.map(msg => ({
          role: msg._getType(),
          content: msg.content
        })),
        toolCalls: threadState.state.toolCalls,
        lastOutput: threadState.lastOutput
      });
    } catch (error) {
      logger.error('Error getting thread state:', error);
      next(error);
    }
  })();
});

export const chainRouter = router;