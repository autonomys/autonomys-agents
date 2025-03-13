import express from 'express';
import { createLogger } from '../utils/logger.js';
import { ApiServer, LogMetadata } from './types.js';
import { config } from '../config/index.js';
import { createApiRouter } from './routes/index.js';
import { broadcastTaskUpdateUtility } from './controller/TaskController.js';
import { Logger } from 'winston';
import { attachLoggerUtility } from './controller/LogsController.js';
import { broadcastLogUtility } from './controller/LogsController.js';
import { getRegisteredNamespaces } from './controller/WorkflowController.js';
import { authenticateToken, securityHeaders } from './middleware/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import helmet from 'helmet';

const logger = createLogger('api-server');

let apiServer: ApiServer | null = null;

const createSingletonApiServer = (): ApiServer => {
  const app = express();

  app.use(corsMiddleware);
  app.use(helmet());
  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const apiRouter = createApiRouter();

  if (config.apiSecurityConfig.ENABLE_AUTH) {
    app.use('/api', authenticateToken, apiRouter);
    logger.info('API authentication enabled');
  } else {
    app.use('/api', apiRouter);
    logger.info('API authentication disabled');
  }

  const PORT = config.API_PORT;
  const server = app.listen(PORT, () => {
    logger.info(`API server started on port ${PORT}`);
    logger.info(`API security: ${config.apiSecurityConfig.ENABLE_AUTH ? 'Enabled' : 'Disabled'}`);
  });

  return {
    app,
    server,
    broadcastLog: broadcastLogUtility,
    broadcastTaskUpdate: broadcastTaskUpdateUtility,
    attachLogger: attachLoggerUtility,
    getRegisteredNamespaces: getRegisteredNamespaces,
  };
};

export const createApiServer = () => {
  if (!apiServer) {
    apiServer = createSingletonApiServer();
  }
  return apiServer;
};

export const broadcastLog = (
  namespace: string,
  level: string,
  message: string,
  meta?: LogMetadata,
) => {
  if (!apiServer) {
    return;
  }

  apiServer.broadcastLog(namespace, level, message, meta);
};

export const broadcastTaskUpdate = (namespace: string) => {
  if (!apiServer) {
    return;
  }

  apiServer.broadcastTaskUpdate(namespace);
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
