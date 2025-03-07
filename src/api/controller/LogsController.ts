import { Request, Response } from 'express';
import { logStreamClients } from './StateController.js';
import { createLogger } from '../../utils/logger.js';
import { LogMetadata } from '../types.js';
import { broadcastLog } from '../server.js';
import { Logger } from 'winston';

const logger = createLogger('api-server-logs-controller');

export const getLogs = (req: Request, res: Response) => {
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
};

////// Utility functions //////
export const broadcastLogUtility = (
  namespace: string,
  level: string,
  message: string,
  meta?: LogMetadata,
) => {
  logStreamClients.forEach((client, clientId) => {
    if (client.namespace === namespace || client.namespace === 'all') {
      const logEvent = {
        type: 'log',
        timestamp: new Date().toISOString(),
        namespace,
        level,
        message,
        meta,
      };

      try {
        client.res.write(`data: ${JSON.stringify(logEvent)}\n\n`);
      } catch (e) {
        logger.error('Error sending to client, removing client', { clientId, error: e });
        logStreamClients.delete(clientId);
      }
    }
  });
};

export const attachLoggerUtility = (existingLogger: Logger, namespace: string): Logger => {
  type LoggerMethod = (message: string | object, ...meta: unknown[]) => Logger;
  const wrapLoggerMethod = (level: string, method: LoggerMethod): LoggerMethod => {
    return function (this: Logger, message: string | object, ...meta: unknown[]): Logger {
      const result = method.apply(this, [message, ...meta]);
      broadcastLog(namespace, level, String(message), meta[0] as LogMetadata);
      return result;
    };
  };

  existingLogger.info = wrapLoggerMethod('info', existingLogger.info);
  existingLogger.debug = wrapLoggerMethod('debug', existingLogger.debug);
  existingLogger.error = wrapLoggerMethod('error', existingLogger.error);

  return existingLogger;
};
