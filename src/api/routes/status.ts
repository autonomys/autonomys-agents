import { Response, Router } from 'express';
import { orchestratorRunners } from '../server.js';

export const createStatusRouter = (): Router => {
  const router = Router();
  // Health check endpoint
  router.get('/health', (_, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/namespaces', (_, res: Response) => {
    res.status(200).json({
      namespaces: Array.from(orchestratorRunners.keys()),
    });
  });

  return router;
};
