import { Router } from 'express';
import { executeWorkflow } from '../controller/WorkflowController.js';

export const createWorkflowsRouter = (): Router => {
  const router = Router();

  router.post('/:namespace/run', executeWorkflow);

  return router;
};
