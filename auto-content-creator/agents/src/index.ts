import express, { Request, Response, NextFunction } from 'express';
import { writerRouter } from './routes/writer';
import logger from './logger';
import { config } from './config';
import { initializeStorage } from './services/writerAgent';

// Create an Express application
const app = express();

const port = config.port;

app.use(express.json());

// Routes
app.use('/writer', writerRouter);

// Health check route
app.get('/', (req, res) => {
  logger.info('Health check request received');
  res.send('Auto Content Creator Agents Service is running!');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An error occurred while processing your request',
    details: err.message
  });
});

// Initialize storage before starting the server
const startServer = async () => {
  try {
    await initializeStorage();
    app.listen(port, () => {
      logger.info(`Agents service is running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
