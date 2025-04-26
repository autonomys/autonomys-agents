import { closeAllVectorDBs } from '../services/vectorDb/vectorDBPool.js';
import { createLogger } from './logger.js';
import { getProjectRoot } from './paths.js';

const logger = createLogger('core');

// Re-export for compatibility
export { getProjectRoot };

// Export these for convenience
export const setupSignalHandlers = () => {
  process.on('SIGINT', () => {
    logger.info('Received SIGINT. Gracefully shutting down...');
    closeAllVectorDBs();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Gracefully shutting down...');
    closeAllVectorDBs();
    process.exit(0);
  });
};
