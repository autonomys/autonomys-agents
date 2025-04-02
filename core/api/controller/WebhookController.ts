import { Request, Response } from 'express';
import { createLogger } from '../../utils/logger.js';
import asyncHandler from 'express-async-handler';
import { orchestratorRunners } from './StateController.js';
import { broadcastTaskUpdateUtility } from './TaskController.js';

const logger = createLogger('WebhookController');

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { type, message } = req.body;

  if (!type || !message) {
    logger.error('Missing required parameters');
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  logger.info(`Received webhook event for type: ${type}`);
  const runner = orchestratorRunners.get('orchestrator');

  if (!runner) {
    logger.error(`No runner found for namespace: orchestrator`);
    res.status(404).json({ error: `No runner found for namespace: orchestrator` });
    return;
  }

  try {
    switch (type) {
      case 'issue':
        const _task = runner.scheduleTask(message, new Date());
        broadcastTaskUpdateUtility('orchestrator');
        res.status(200).json({ message: 'Webhook received and task scheduled' });
        break;
      default:
        logger.error(`Unsupported webhook type: ${type}`);
        res.status(400).json({ error: `Unsupported webhook type: ${type}` });
        break;
    }
  } catch (error) {
    logger.error(`Error processing webhook: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});
