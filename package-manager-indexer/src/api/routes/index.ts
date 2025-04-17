import express from 'express';
import toolRoutes from './toolRoutes.js';
import systemRoutes from './systemRoutes.js';

/**
 * Configures and applies all routes to the Express app
 * @param app Express application instance
 */
export const applyRoutes = (app: express.Application): void => {
  // API routes for tools
  app.use('/api/v1/tools', toolRoutes);
  
  // System routes for health and status
  app.use('/', systemRoutes);
}; 