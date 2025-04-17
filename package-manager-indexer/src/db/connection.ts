import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('db-connection');

export const parseConnectionString = (url: string) => {
  // Handle connection strings with or without password
  const regexWithPassword = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\//;
  const regexWithoutPassword = /postgresql:\/\/([^@]+)@([^:]+):(\d+)\//;
  
  let match = url.match(regexWithPassword);
  if (match) {
    const [_, user, password, host, port] = match;
    return { user, password, host, port };
  }
  
  match = url.match(regexWithoutPassword);
  if (match) {
    const [_, user, host, port] = match;
    return { user, password: '', host, port };
  }
  
  throw new Error(`Invalid connection string: ${url}`);
};

// Create a database pool
export const createPool = (database = 'package_registry') => {
  try {
    // Check if we have a full connection string
    if (config.DATABASE_URL.includes('postgresql://')) {
      try {
        const connectionDetails = parseConnectionString(config.DATABASE_URL);
        return new Pool({
          user: connectionDetails.user,
          password: connectionDetails.password,
          host: connectionDetails.host,
          port: parseInt(connectionDetails.port),
          database,
        });
      } catch (error) {
        // Fallback to direct connection string if parsing fails
        logger.warn('Failed to parse connection string, using direct connection');
        return new Pool({
          connectionString: config.DATABASE_URL,
        });
      }
    } else {
      // Otherwise, use the connection string directly
      return new Pool({
        connectionString: config.DATABASE_URL,
      });
    }
  } catch (error) {
    logger.error('Failed to create database pool:', error);
    throw error;
  }
};

// Export default pool
export const pool = createPool(); 