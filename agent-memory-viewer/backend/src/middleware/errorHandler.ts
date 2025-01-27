import { ErrorRequestHandler } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('error-handler');

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
};
