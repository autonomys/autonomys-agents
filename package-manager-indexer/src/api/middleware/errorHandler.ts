import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('error-handler');

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export const errorHandler = (err: ApiError, req: Request, res: Response) => {
  const statusCode = err.statusCode || 500;

  logger.error(`API Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: err.stack,
    details: err.details,
  });

  res.status(statusCode).json({
    error: {
      message: err.message,
      status: statusCode,
      timestamp: new Date().toISOString(),
    },
  });
};
