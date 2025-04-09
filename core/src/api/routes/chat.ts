import { Router } from 'express';
import { createChatController } from '../controller/ChatController.js';
import { LLMFactoryConfig } from '../../services/llm/factory.js';

export const createChatRouter = (dataPath: string, llmConfig: LLMFactoryConfig): Router => {
  const router = Router();

  // Initialize the controller with the LLM configuration
  const { getChatStream, sendChatMessage } = createChatController(llmConfig);

  router.get('/namespaces/:namespace/chat/stream', getChatStream);
  router.post('/namespaces/:namespace/chat', sendChatMessage(dataPath));

  return router;
};
