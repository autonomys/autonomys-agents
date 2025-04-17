import express from 'express';
import {
  listTools,
  getToolByNameHandler,
  getToolVersionsHandler,
  getLatestVersionsHandler,
  searchToolsHandler,
  getToolsByPublisherHandler
} from '../controllers/toolController.js';

const router = express.Router();

// GET /api/v1/tools - List all tools with pagination
router.get('/', listTools);

// GET /api/v1/tools/search?q=searchTerm - Search tools by name
router.get('/search', searchToolsHandler);

// GET /api/v1/tools/latest - Get latest version for each tool
router.get('/latest', getLatestVersionsHandler);

// GET /api/v1/tools/publisher/:address - Get tools by publisher address
router.get('/publisher/:address', getToolsByPublisherHandler);

// GET /api/v1/tools/name/:name - Get a specific tool by name
router.get('/name/:name', getToolByNameHandler);

// GET /api/v1/tools/:toolId/versions - Get versions for a specific tool
router.get('/:toolId/versions', getToolVersionsHandler);

export default router; 