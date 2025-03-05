import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import { createLogger } from '../utils/logger.js';
import { OrchestratorRunner } from '../agents/workflows/orchestrator/orchestratorWorkflow.js';
import { ApiServer, LogMetadata } from './types.js';
import { config } from '../config/index.js';
import { HumanMessage } from '@langchain/core/messages';
import asyncHandler from 'express-async-handler';

const logger = createLogger('api-server');

const logStreamClients = new Map<number, { res: Response; namespace: string }>();

const orchestratorRunners = new Map<string, OrchestratorRunner>();

let apiServer: ApiServer | null = null;

const createSingletonApiServer = (): ApiServer => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const apiRouter = Router();

  apiRouter.get('/:namespace/logs', (req: Request, res: Response) => {
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

  apiRouter.get('/health', (_, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  apiRouter.get('/namespaces', (_, res: Response) => {
    res.status(200).json({
      namespaces: Array.from(orchestratorRunners.keys()),
    });
  });

  apiRouter.post(
    '/:namespace/run',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      logger.info(`Starting workflow execution for namespace: ${namespace}`);

      const result = await runner.runWorkflow(
        { messages: [new HumanMessage(message)] },
        { threadId: `api-${namespace}-${Date.now()}` },
      );

      res.status(200).json({
        status: 'success',
        result,
      });
    }),
  );

  app.use('/api', apiRouter);

  const PORT = config.API_PORT;
  const server = app.listen(PORT, () => {
    logger.info(`API server started on port ${PORT}`);
  });

  const broadcastLog = (namespace: string, level: string, message: string, meta?: LogMetadata) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachLogger = (existingLogger: any, namespace: string) => {
    const originalInfo = existingLogger.info;
    const originalDebug = existingLogger.debug;
    const originalError = existingLogger.error;

    existingLogger.info = (msg: string, meta?: LogMetadata) => {
      originalInfo.call(existingLogger, msg, meta);
      broadcastLog(namespace, 'info', msg, meta);
    };

    existingLogger.debug = (msg: string, meta?: LogMetadata) => {
      originalDebug.call(existingLogger, msg, meta);
      broadcastLog(namespace, 'debug', msg, meta);
    };

    existingLogger.error = (msg: string, meta?: LogMetadata) => {
      originalError.call(existingLogger, msg, meta);
      broadcastLog(namespace, 'error', msg, meta);
    };

    return existingLogger;
  };

  return {
    app,
    server,
    registerRunner: (namespace: string, runner: OrchestratorRunner) => {
      orchestratorRunners.set(namespace, runner);
      logger.info(`Registered orchestrator runner with namespace: ${namespace}`);
      return { namespace, runner };
    },
    broadcastLog,
    attachLogger,
    getRegisteredNamespaces: () => {
      return Array.from(orchestratorRunners.keys());
    },
  };
};

export const createApiServer = () => {
  if (!apiServer) {
    apiServer = createSingletonApiServer();
  }
  return apiServer;
};

export const registerRunner = (namespace: string, runner: OrchestratorRunner) => {
  const api = createApiServer();
  return api.registerRunner(namespace, runner);
};

export const broadcastLog = (
  namespace: string,
  level: string,
  message: string,
  meta?: LogMetadata,
) => {
  if (apiServer) {
    apiServer.broadcastLog(namespace, level, message, meta);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const attachLogger = (logger: any, namespace: string) => {
  const api = createApiServer();
  return api.attachLogger(logger, namespace);
};
