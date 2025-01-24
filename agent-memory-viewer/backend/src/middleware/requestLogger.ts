import { RequestHandler } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('request-logger');

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });
  next();
};
