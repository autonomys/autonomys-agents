import rateLimit from 'express-rate-limit';
import { createLogger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

const logger = createLogger('rate-limiter');

/**
 * Rate limiter configuration for API endpoints
 * Limits the number of requests a client can make within a specified window
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60, // Limit each IP to 60 requests per minute
  standardHeaders: 'draft-7', // Use recommended draft-7 header format
  legacyHeaders: false, // Disable legacy X-RateLimit headers
  message: 'Too many requests from this IP, please try again after a minute',
  
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000) // in seconds
    });
  },
  skipSuccessfulRequests: config.NODE_ENV === 'development'
});

/**
 * More restrictive rate limiter for sensitive operations
 * For endpoints that should have stricter rate limits
 */
export const strictRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 20, // Limit each IP to 20 requests per 5 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests for this operation, please try again after 5 minutes',
  
  handler: (req, res, next, options) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(options.statusCode).json({
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000) // in seconds
    });
  },
  
  skipSuccessfulRequests: config.NODE_ENV === 'development'
}); 