import { Router } from 'express';
import { executeWorkflow, externalStopWorkflow } from '../controller/WorkflowController.js';

export const createWorkflowsRouter = (): Router => {
  const router = Router();

  router.post('/:namespace/run', executeWorkflow);
  router.post('/stop', externalStopWorkflow);

  return router;
};
