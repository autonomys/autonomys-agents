import { NextFunction, Request, Response } from 'express';
import { createLogger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

const logger = createLogger('auth-middleware');

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!config.apiSecurityConfig.ENABLE_AUTH) {
    next();
    return;
  }

  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    logger.warn('Authentication failed: No token provided');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (token !== config.apiSecurityConfig.API_TOKEN) {
    logger.warn('Authentication failed: Invalid token');
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  next();
};

/**
 * Security headers middleware to add basic protection
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Only set HSTS in production
  if (config.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};
