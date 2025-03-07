import { Router } from 'express';
import { getLogs } from '../controller/LogsController.js';

export const createLogsRouter = (): Router => {
  const router = Router();

  router.get('/:namespace/logs', getLogs);

  return router;
};
