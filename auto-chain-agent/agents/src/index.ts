import express, { Request, Response, NextFunction } from 'express';
import logger from './logger';
import { config } from './config';
import { chainRouter } from './routes/chainAgentRoutes';

// Create Express application
const app = express();
const port = config.port;

app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  logger.info('Health check request received');
  res.send('Auto Chain Agents Service is running!');
});

// Add blockchain agent routes
app.use('/blockchain-agent', chainRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An error occurred while processing your request',
    details: err.message
  });
});

// Start the server
app.listen(port, () => {
  logger.info(`Agents service is running on http://localhost:${port}`);
}); 