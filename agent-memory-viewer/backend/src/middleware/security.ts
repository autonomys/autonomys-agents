import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import express from 'express';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

export const setupSecurity = (app: express.Application) => {
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    }),
  );
  app.use(limiter);
  app.use(express.json());
};
