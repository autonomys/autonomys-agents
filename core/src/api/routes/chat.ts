import { Router } from 'express';
import { getChatStream, sendChatMessage } from '../controller/ChatController.js';

export const createChatRouter = (dataPath: string): Router => {
  const router = Router();

  router.get('/namespaces/:namespace/chat/stream', getChatStream);
  router.post('/namespaces/:namespace/chat', sendChatMessage(dataPath));

  return router;
};
