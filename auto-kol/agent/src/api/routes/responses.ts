import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { getAllPendingResponses } from '../../services/database/index.js';

const router = Router();
const logger = createLogger('responses-api');

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
