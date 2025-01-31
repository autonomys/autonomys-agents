import { createLogger } from '../utils/logger.js';

const logger = createLogger('list-command');

export async function listTools() {
  try {
    logger.info('Fetching available tools');
    
    // TODO: Implement the following steps:
    // 1. Fetch registry index
    // 2. Format tool list
    // 3. Display tools with descriptions
    
    logger.info('Tools listed successfully');
  } catch (error) {
    logger.error('Failed to list tools:', error);
    process.exit(1);
  }
} 