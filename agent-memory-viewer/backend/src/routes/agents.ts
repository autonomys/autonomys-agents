import { Router } from 'express';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('agents');
const router = Router();

router.get('/agents', async (_, res) => {
  try {
    const agents = config.AGENTS.map(agent => ({
      username: agent.username,
      address: agent.address,
    }));
    res.json({ agents });
  } catch (error) {
    logger.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

export default router;
