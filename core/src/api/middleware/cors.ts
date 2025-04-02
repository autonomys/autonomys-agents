import cors from 'cors';
import { config } from '../../config/index.js';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.apiSecurityConfig.CORS_ALLOWED_ORIGINS;

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('CORS policy violation: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
