import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const config = {
    // Twitter API Configuration
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    TWITTER_USERNAME: process.env.TWITTER_USERNAME,
    TWITTER_PASSWORD: process.env.TWITTER_PASSWORD,

    // LLM Configuration
    LLM_MODEL: process.env.LLM_MODEL || "gpt-4",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TEMPERATURE: 0.7,

    // Agent Configuration
    CHECK_INTERVAL: 60 * 1000 * 15, // 15 minutes
    MEMORY_DIR: path.join(__dirname, '../../data/memory'),

    // Blockchain Configuration
    NETWORK: process.env.NETWORK || 'mainnet',

    // Server Configuration
    PORT: process.env.PORT || 3001,

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Target Accounts to Monitor
    TARGET_ACCOUNTS: (process.env.TARGET_ACCOUNTS || '').split(',').map(account => account.trim()),

    // Chroma Configuration
    CHROMA_DIR: path.join(__dirname, '../../data/chroma'),
    CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',

    // AutoDrive Configuration
    DSN_API_KEY: process.env.DSN_API_KEY,
}; 