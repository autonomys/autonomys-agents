import { Request, Response, Router } from 'express';
import { orchestratorRunners } from '../server.js';
import { createLogger } from '../../utils/logger.js';
import asyncHandler from 'express-async-handler';
import { broadcastTaskUpdate } from '../server.js';
const logger = createLogger('api-server');

export const createWorkflowsRouter = (): Router => {
  const router = Router();

  router.post(
    '/:namespace/run',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      runner.scheduleTask(message, new Date(Date.now()));
      broadcastTaskUpdate(namespace);

      res.status(200).json({
        status: 'success',
      });
    }),
  );

  return router;
};
