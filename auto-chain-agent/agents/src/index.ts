import express from 'express';
import { chainRouter } from './routes/chainAgentRoutes';
import logger from './logger';
import { config } from './config';
import cors from 'cors';

const app = express();
const port = config.port || 3000;

app.use(express.json());
app.use(cors());

// Routes
app.use('/chainagent', chainRouter);

// Health check route
app.get('/', (req, res) => {
  logger.info('Health check request received');
  res.send('Blockchain Agent Service is running!');
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An error occurred while processing your request',
    details: err.message
  });
});

app.listen(port, () => {
  logger.info(`Blockchain agent service is running on http://localhost:${port}`);
}); 