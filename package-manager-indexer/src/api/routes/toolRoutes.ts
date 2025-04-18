import express from 'express';
import {
  listTools,
  getToolByNameHandler,
  getToolVersionsHandler,
  getLatestVersionsHandler,
  searchToolsHandler,
  getToolsByPublisherHandler
} from '../controllers/toolController.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('tool-routes');
const router = express.Router();

// GET /api/v1/tools - List all tools with pagination
router.get('/', listTools);

// GET /api/v1/tools/search?q=searchTerm - Search tools by name
// apply strict rate limiting
router.get('/search', strictRateLimiter, searchToolsHandler);
logger.info('Applied strict rate limiting to /api/v1/tools/search endpoint');

// GET /api/v1/tools/latest - Get latest version for each tool
router.get('/latest', getLatestVersionsHandler);

// GET /api/v1/tools/publisher/:address - Get tools by publisher address
router.get('/publisher/:address', getToolsByPublisherHandler);

// GET /api/v1/tools/name/:name - Get a specific tool by name
router.get('/name/:name', getToolByNameHandler);

// GET /api/v1/tools/:toolId/versions - Get versions for a specific tool
// This might return a lot of data for tools with many versions
router.get('/:toolId/versions', strictRateLimiter, getToolVersionsHandler);
logger.info('Applied strict rate limiting to /api/v1/tools/:toolId/versions endpoint');

export default router; 