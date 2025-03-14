import { Router } from 'express';
import { handleWebhook } from '../controller/WebhookController.js';

export const createWebhooksRouter = (): Router => {
  const router = Router();

  router.post('/webhook', handleWebhook);

  return router;
};
