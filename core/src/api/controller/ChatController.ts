import { Request, Response } from 'express';
import { createLogger } from '../../utils/logger.js';
import asyncHandler from 'express-async-handler';
import { getVectorDB } from '../../services/vectorDb/vectorDBPool.js';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { chatStreamClients } from './StateController.js';
import { responsePrompt, searchParamsParser, searchPrompt } from './prompt/ChatPrompts.js';
import { LLMFactory } from '../../services/llm/factory.js';
import { LLMFactoryConfig } from '../../services/llm/types.js';
const logger = createLogger('chat-controller');
interface SearchParams {
  query: string;
  metadataFilter?: string | '';
  limit?: number;
}

// Factory for creating controller with injected config
export const createChatController = (llmConfig: LLMFactoryConfig) => {
  const searchQueryModel = LLMFactory.createModel(
    {
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.3,
    },
    llmConfig,
  );

  const streamingModel = LLMFactory.createModel(
    {
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.7,
    },
    llmConfig,
  );

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

  const sendChatMessage = (dataPath: string) =>
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      try {
        const db = getVectorDB('experiences', llmConfig, dataPath);
        const searchChain = searchPrompt.pipe(searchQueryModel).pipe(searchParamsParser);
        logger.info('Generating search parameters...');

        let searchParams: SearchParams;
        try {
          searchParams = await searchChain.invoke({
            message: message,
          });

          logger.info('Generated search parameters:', { searchParams, namespace });
        } catch (parseError) {
          logger.error('Error generating search parameters:', parseError);
          searchParams = {
            query: message,
            limit: 5,
          };
        }

        const relevantContext = await db.search(searchParams);
        logger.info('Relevant context:', { relevantContext, namespace });
        const contextText = relevantContext.map(item => item.content).join('\n\n');

        const responseChain = responsePrompt.pipe(streamingModel).pipe(new StringOutputParser());

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');

        const stream = await responseChain.stream({
          namespace,
          contextText,
          message,
        });

        let fullResponse = '';

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
          fullResponse += chunk;
        }

        res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
        res.end();

        broadcastChatMessageUtility(namespace, {
          role: 'agent',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error processing chat message', { error, namespace });
        res.status(500).json({
          error: 'Failed to process chat message',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

  return {
    getChatStream,
    sendChatMessage,
  };
};

export const broadcastChatMessageUtility = (
  namespace: string,
  message: {
    role: 'user' | 'agent';
    content: string;
    timestamp: string;
  },
): void => {
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
