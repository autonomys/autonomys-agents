import { Router } from 'express';
import { getHealth, getNamespaces } from '../controller/StatusController.js';

export const createStatusRouter = (): Router => {
  const router = Router();

  router.get('/health', getHealth);
  router.get('/namespaces', getNamespaces);

  return router;
};
