import { Request, Response } from 'express';
import { createLogger } from '../../utils/logger.js';
import asyncHandler from 'express-async-handler';
import { chatStreamClients } from './StateController.js';
import { v4 as uuidv4 } from 'uuid';
import { ChatWorkflow } from '../../agents/chat/types.js';

const logger = createLogger('chat-controller');
const config = { configurable: { thread_id: uuidv4() } };

// Factory for creating controller with injected config
export const createChatController = (chatAppInstance: ChatWorkflow) => {
  const getChatStream = (req: Request, res: Response) => {
    const { namespace } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    res.write(
      `data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to chat stream',
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    const clientId = Date.now();
    chatStreamClients.set(clientId, { res, namespace });

    req.on('close', () => {
      chatStreamClients.delete(clientId);
      logger.info(`Client ${clientId} disconnected from chat stream`);
    });
  };

  const sendChatMessage = () =>
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;
      const { message } = req.body;
      const input = {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      };
      const compiledWorkflow = await chatAppInstance;
      const result = await compiledWorkflow.invoke(input, config);
      broadcastChatMessageUtility(
        namespace,
        result.messages[result.messages.length - 1].lc_kwargs.content,
      );
      const responses = {
        role: result.messages[result.messages.length - 1].lc_id[
          result.messages[result.messages.length - 1].lc_id.length - 1
        ],
        content: result.messages[result.messages.length - 1].lc_kwargs.content,
      };
      res.json(responses);
    });

  return {
    getChatStream,
    sendChatMessage,
  };
};

export const broadcastChatMessageUtility = (namespace: string, message: string): void => {
  chatStreamClients.forEach((client, clientId) => {
    if (client.namespace === namespace || client.namespace === 'all') {
      const chatEvent = {
        type: 'message',
        namespace,
        message,
      };

      try {
        client.res.write(`data: ${JSON.stringify(chatEvent)}\n\n`);
      } catch (e) {
        logger.error('Error sending chat message to client, removing client', {
          clientId,
          error: e,
        });
        chatStreamClients.delete(clientId);
      }
    }
  });
};
