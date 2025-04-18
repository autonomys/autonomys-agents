import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../utils/logger.js';
import {
  getAllTools,
  getToolByName,
  getToolVersions,
  getLatestToolVersions,
  searchTools,
  getToolsByPublisher,
} from '../../db/repositories/apiRepository.js';
import { ApiError } from '../middleware/errorHandler.js';

const logger = createLogger('tool-controller');

// Get all tools with pagination
export const listTools = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get query parameters with defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    if (page < 1) {
      const error = new Error('Page must be greater than 0') as ApiError;
      error.statusCode = 400;
      return next(error);
    }

    if (limit < 1 || limit > 100) {
      const error = new Error('Limit must be between 1 and 100') as ApiError;
      error.statusCode = 400;
      return next(error);
    }

    const result = await getAllTools(page, limit, sortBy, sortOrder);

    res.json({
      data: result.tools,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getToolByNameHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    if (!name) {
      const error = new Error('Tool name is required') as ApiError;
      error.statusCode = 400;
      return next(error);
    }

    const tool = await getToolByName(name);

    if (!tool) {
      const error = new Error(`Tool '${name}' not found`) as ApiError;
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      data: tool,
    });
  } catch (error) {
    next(error);
  }
};

// Get versions for a specific tool
export const getToolVersionsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toolId } = req.params;
    if (!toolId || isNaN(parseInt(toolId))) {
      const error = new Error('Valid tool ID is required') as ApiError;
      error.statusCode = 400;
      return next(error);
    }

    const versions = await getToolVersions(parseInt(toolId));

    res.json({
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

// Get latest version for each tool
export const getLatestVersionsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latestVersions = await getLatestToolVersions();

    res.json({
      data: latestVersions,
    });
  } catch (error) {
    next(error);
  }
};

// Search tools by name
export const searchToolsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q) {
      const error = new Error('Search query is required') as ApiError;
      error.statusCode = 400;
      return next(error);
    }

    const results = await searchTools(q as string, limit);

    res.json({
      data: results,
      meta: {
        query: q,
        count: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get tools by publisher address
export const getToolsByPublisherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { address } = req.params;

    if (!address) {
      const error = new Error('Publisher address is required') as ApiError;
      error.statusCode = 400;
      return next(error);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getToolsByPublisher(address, page, limit);

    res.json({
      data: result.tools,
      meta: {
        publisher: address,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
