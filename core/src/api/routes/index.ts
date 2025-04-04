import { Router } from 'express';
import { createLogsRouter } from './logs.js';
import { createStatusRouter } from './status.js';
import { createWorkflowsRouter } from './workflows.js';
import { createTasksRouter } from './tasks.js';
import { createChatRouter } from './chat.js';
import { createWebhooksRouter } from './webhooks.js';
import { createCharacterRouter } from './character.js';
import { createNamespacesRouter } from './namespaces.js';

export const createApiRouter = (): Router => {
  const apiRouter = Router();

  apiRouter.use(createLogsRouter());
  apiRouter.use(createStatusRouter());
  apiRouter.use(createWorkflowsRouter());
  apiRouter.use(createTasksRouter());
  apiRouter.use(createChatRouter());
  apiRouter.use(createWebhooksRouter());
  apiRouter.use(createCharacterRouter());
  apiRouter.use(createNamespacesRouter());

  return apiRouter;
};
