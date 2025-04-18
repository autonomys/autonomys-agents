import express from 'express';
import { getLastProcessedBlock } from '../../db/repositories/toolRepository.js';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('system-routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Indexer status endpoint
router.get('/status', async (req, res) => {
  try {
    const lastProcessedBlock = await getLastProcessedBlock();
    res.json({
      status: 'running',
      lastProcessedBlock,
      startBlock: config.START_BLOCK,
      contractAddress: config.CONTRACT_ADDRESS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching indexer status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch indexer status',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
