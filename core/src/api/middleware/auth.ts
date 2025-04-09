import { NextFunction, Request, Response } from 'express';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('auth-middleware');

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

/**
 * Creates a middleware function that authenticates requests using the provided token
 * @param authToken The token to check incoming requests against
 * @returns An Express middleware function
 */
export const createAuthMiddleware = (authToken: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    if (token !== authToken) {
      logger.warn('Authentication failed: Invalid token');
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    next();
  };
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
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};
