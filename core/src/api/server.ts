import express from 'express';
import { createLogger } from '../utils/logger.js';
import { ApiConfig, ApiServer, CreateApiServerParams, LogMetadata } from './types.js';
import { createApiRouter } from './routes/index.js';
import { broadcastTaskUpdateUtility } from './controller/TaskController.js';
import { attachLoggerUtility, broadcastLogUtility } from './controller/LogsController.js';
import { broadcastNamespaces } from './controller/NamespaceController.js';
import { getRegisteredNamespaces } from './controller/WorkflowController.js';
import { createAuthMiddleware, securityHeaders } from './middleware/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import { getProjectRoot } from '../utils/utils.js';
import helmet from 'helmet';
import http2 from 'http2';
import fs from 'fs';
import path from 'path';
import http2Express from 'http2-express-bridge';
import { Express } from 'express';
import { Logger } from 'winston';

const logger = createLogger('api-server');

let apiServer: ApiServer | null = null;

const createSingletonApiServer = (params: CreateApiServerParams): ApiServer => {
  const { characterName, dataPath, authFlag, authToken, apiPort, allowedOrigins, llmConfig } =
    params;
  const app = http2Express(express) as unknown as Express;

  app.use(corsMiddleware(allowedOrigins));
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const apiRouter = createApiRouter(characterName, dataPath, llmConfig);

  if (authFlag) {
    app.use('/api', createAuthMiddleware(authToken));
    app.use('/api', apiRouter);
    logger.info('API authentication enabled');
  } else {
    app.use('/api', apiRouter);
    logger.info('API authentication disabled');
  }

  const PORT = apiPort;
  let server;

  const certsDir = path.join(getProjectRoot(), 'certs');
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
        logger.info(`API security: ${authFlag ? 'Enabled' : 'Disabled'}`);
        logger.info(`Access the API at: https://localhost:${PORT}/api`);
        logger.info(
          `Server-Sent Events available at: https://localhost:${PORT}/api/namespaces/sse`,
        );
      });
    } else {
      throw new Error('SSL certificates not found');
    }
  } catch (error) {
    logger.error('Error starting HTTP/2 server', error);
    throw error;
  }

  return {
    app,
    server,
    broadcastLog: broadcastLogUtility,
    broadcastTaskUpdate: broadcastTaskUpdateUtility,
    attachLogger: attachLoggerUtility,
    getRegisteredNamespaces: getRegisteredNamespaces,
    broadcastNamespaces: broadcastNamespaces,
  };
};

export const createApiServer = (params: CreateApiServerParams) => {
  if (!apiServer) {
    apiServer = createSingletonApiServer(params);
  }
  return apiServer;
};

export const getApiServer = () => {
  if (!apiServer) {
    throw new Error('API server not initialized');
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

// Add a wrapper function to broadcast namespace updates
export const broadcastNamespacesUpdate = () => {
  if (!apiServer) {
    return;
  }

  apiServer.broadcastNamespaces();
};

export const attachLogger = (logger: Logger, namespace: string, flag: boolean) => {
  if (!flag) {
    return logger;
  }
  const api = getApiServer();
  return api.attachLogger(logger, namespace);
};

// Helper function
export const withApiLogger = (namespace: string, flag: boolean) => {
  const logger = createLogger(`orchestrator-workflow-${namespace}`);
  const enhancedLogger = attachLogger(logger, namespace, flag);
  return {
    logger: enhancedLogger,
  };
};

export { type ApiConfig, type CreateApiServerParams };
