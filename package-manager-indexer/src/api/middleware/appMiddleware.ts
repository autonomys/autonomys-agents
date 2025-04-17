import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('app-middleware');

/**
 * Configures and applies all application middleware to the Express app
 * @param app Express application instance
 */
export const applyMiddleware = (app: express.Application): void => {
  // Security middleware
  app.use(helmet() as any);
  
  // Compression middleware
  app.use(compression() as any);
  
  // CORS middleware
  app.use(cors() as any);
  
  // Body parsing middleware
  app.use(express.json() as any);
  
  // Logging middleware
  app.use(morgan('dev', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}; 