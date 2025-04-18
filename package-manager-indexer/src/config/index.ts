import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

// Load .env file
dotenv.config({ path: path.resolve(rootDir, '.env') });

interface Config {
  // Blockchain settings
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
  
  // Database settings
  DATABASE_URL: string;
  
  // Indexer settings
  START_BLOCK: number;
  POLL_INTERVAL_MS: number;
  
  // API settings
  API_PORT: number;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  
  // Node environment
  NODE_ENV: 'development' | 'production';
}

// Validate and export configuration
export const config: Config = {
  // Blockchain settings
  RPC_URL: process.env.RPC_URL || '',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
  
  // Database settings
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Indexer settings
  START_BLOCK: parseInt(process.env.START_BLOCK || '0'),
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || '15000'),
  
  // API settings
  API_PORT: parseInt(process.env.API_PORT || '3000'),
  
  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL as Config['LOG_LEVEL']) || 'info',
  
  // Node environment
  NODE_ENV: (process.env.NODE_ENV as Config['NODE_ENV']) || 'development',
};

// Validate required configuration
const validateConfig = () => {
  const requiredKeys: Array<keyof Config> = [
    'RPC_URL',
    'CONTRACT_ADDRESS',
    'DATABASE_URL',
  ];
  
  const missingKeys = requiredKeys.filter((key) => !config[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required configuration: ${missingKeys.join(', ')}`);
  }
};

validateConfig(); 