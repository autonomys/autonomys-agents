import express from 'express';
import { createLogger } from '../../utils/logger.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';
import toolRoutes from './toolRoutes.js';
import systemRoutes from './systemRoutes.js';

const logger = createLogger('api-routes');

/**
 * Configures and applies all routes to the Express app
 * @param app Express application instance
 */
export const applyRoutes = (app: express.Application): void => {
  // Apply stricter rate limiting to specific resource-intensive routes
  // These should be applied before the routes are registered
  const strictLimitedRoutes = ['/api/v1/tools/search', '/api/v1/tools/versions'];

  strictLimitedRoutes.forEach(route => {
    logger.info(`Applying strict rate limiting to route: ${route}`);
    app.use(route, strictRateLimiter);
  });

  // API routes for tools
  app.use('/api/v1/tools', toolRoutes);

  // System routes for health and status
  app.use('/', systemRoutes);

  // 404 handler for API routes
  app.use('/api/v1/*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
};
