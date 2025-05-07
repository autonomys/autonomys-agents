import { Router } from 'express';
import { createLogsRouter } from './logs.js';
import { createStatusRouter } from './status.js';
import { createWorkflowsRouter } from './workflows.js';
import { createTasksRouter } from './tasks.js';
import { createChatRouter } from './chat.js';
import { createWebhooksRouter } from './webhooks.js';
import { createCharacterRouter } from './character.js';
import { createNamespacesRouter } from './namespaces.js';
import { ChatWorkflow } from '../../agents/chat/types.js';

export const createApiRouter = (characterName: string, chatAppInstance?: ChatWorkflow): Router => {
  const apiRouter = Router();

  apiRouter.use(createLogsRouter());
  apiRouter.use(createStatusRouter());
  apiRouter.use(createWorkflowsRouter());
  apiRouter.use(createTasksRouter());
  apiRouter.use(createChatRouter(chatAppInstance));
  apiRouter.use(createWebhooksRouter());
  apiRouter.use(createCharacterRouter(characterName));
  apiRouter.use(createNamespacesRouter());

  return apiRouter;
};
