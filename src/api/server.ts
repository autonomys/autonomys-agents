import express, { Response } from 'express';
import cors from 'cors';
import { createLogger } from '../utils/logger.js';
import { OrchestratorRunner } from '../agents/workflows/orchestrator/orchestratorWorkflow.js';
import { ApiServer, LogMetadata } from './types.js';
import { config } from '../config/index.js';
import { createApiRouter } from './routes/index.js';

import { Logger } from 'winston';
const logger = createLogger('api-server');

export const logStreamClients = new Map<number, { res: Response; namespace: string }>();
export const orchestratorRunners = new Map<string, OrchestratorRunner>();

let apiServer: ApiServer | null = null;

const createSingletonApiServer = (): ApiServer => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const apiRouter = createApiRouter();
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

  const attachLogger = (existingLogger: Logger, namespace: string): Logger => {
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

export const attachLogger = (logger: Logger, namespace: string) => {
  const api = createApiServer();
  return api.attachLogger(logger, namespace);
};

// Helper function
export const withApiLogger = (namespace: string) => {
  const logger = createLogger(`orchestrator-workflow-${namespace}`);
  const enhancedLogger = attachLogger(logger, namespace);

  return {
    logger: enhancedLogger,
  };
};

// Helper function
export const registerRunnerWithApi = async (
  runnerPromise: Promise<OrchestratorRunner>,
  api: ApiServer,
  namespace: string,
): Promise<OrchestratorRunner> => {
  const runner = await runnerPromise;
  api.registerRunner(namespace, runner);
  return runner;
};
