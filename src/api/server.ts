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
import http2 from 'http2';
import fs from 'fs';
import path from 'path';
import http2Express from 'http2-express-bridge';
import { Express } from 'express';

const logger = createLogger('api-server');

let apiServer: ApiServer | null = null;

const createSingletonApiServer = (): ApiServer => {
  const app = http2Express(express) as unknown as Express;

  app.use(corsMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
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
  let server;

  const certsDir = path.join(process.cwd(), 'certs');
  const certFile = path.join(certsDir, 'server.cert');
  const keyFile = path.join(certsDir, 'server.key');

  try {
    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      const options = {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
        allowHTTP1: true,
      };
      server = http2.createSecureServer(options, app);
      server.listen(PORT, () => {
        logger.info(`API server started with HTTP/2 support on port ${PORT}`);
        logger.info(
          `API security: ${config.apiSecurityConfig.ENABLE_AUTH ? 'Enabled' : 'Disabled'}`,
        );
        logger.info(`Access the API at: https://localhost:${PORT}/api`);
      });
    } else {
      throw new Error('SSL certificates not found');
    }
  } catch (error) {
    logger.error('Error starting HTTP/2 server, falling back to HTTP/1.1', error);
    throw error;
  }

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
