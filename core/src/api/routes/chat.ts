import { Router } from 'express';
import { createChatController } from '../controller/ChatController.js';
import { ChatWorkflow } from '../../agents/chat/types.js';

export const createChatRouter = (chatAppInstance?: ChatWorkflow): Router => {
  const router = Router();
  if (chatAppInstance) {
    const { getChatStream, sendChatMessage } = createChatController(chatAppInstance);
    router.get('/namespaces/:namespace/chat/stream', getChatStream);
    router.post('/namespaces/:namespace/chat', sendChatMessage());
  }

  return router;
};
