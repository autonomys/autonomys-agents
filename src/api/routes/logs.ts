import { Request, Response, Router } from 'express';
import { logStreamClients } from '../server.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('api-server');

export const createLogsRouter = (): Router => {
  const router = Router();

  router.get('/:namespace/logs', (req: Request, res: Response) => {
    const { namespace } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(
      `data: ${JSON.stringify({ type: 'connection', message: 'Connected to log stream' })}\n\n`,
    );

    const clientId = Date.now();

    logStreamClients.set(clientId, { res, namespace });

    req.on('close', () => {
      logStreamClients.delete(clientId);
      logger.info(`Client ${clientId} disconnected from log stream`);
    });
  });

  return router;
};
