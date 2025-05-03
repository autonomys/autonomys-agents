import { Router } from 'express';
import { createChatController } from '../controller/ChatController.js';

export const createChatRouter = (): Router => {
  const router = Router();

  // Initialize the controller with the LLM configuration
  const { getChatStream, sendChatMessage } = createChatController();

  router.get('/namespaces/:namespace/chat/stream', getChatStream);
  router.post('/namespaces/:namespace/chat', sendChatMessage());

  return router;
};
