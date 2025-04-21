import express from 'express';
import { createLogger } from '../utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { applyMiddleware } from './middleware/appMiddleware.js';
import { applyRoutes } from './routes/index.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

const logger = createLogger('api-server');

export const createServer = () => {
  const app = express();

  // Apply all middleware
  applyMiddleware(app);

  // Apply rate limiting
  app.use(apiRateLimiter);
  logger.info('API rate limiting enabled: 60 requests per minute per IP');

  // Apply all routes
  applyRoutes(app);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

export const startServer = (port = 3000) => {
  const app = createServer();

  const server = app.listen(port, () => {
    logger.info(`API server running on port ${port}`);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down API server...');
    server.close(() => {
      logger.info('API server closed');
    });
  };

  return { server, shutdown };
};
