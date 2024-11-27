import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    // Twitter API Configuration
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,

    // LLM Configuration
    LLM_MODEL: process.env.LLM_MODEL || "gpt-4",
    TEMPERATURE: 0.7,

    // Agent Configuration
    CHECK_INTERVAL: 30 * 1000, // 30 seconds
    MEMORY_DIR: path.join(__dirname, '../../data/memory'),

    // Blockchain Configuration
    NETWORK: process.env.NETWORK || 'mainnet',

    // Server Configuration
    PORT: process.env.PORT || 3001,

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Target Accounts to Monitor
    TARGET_ACCOUNTS: (process.env.TARGET_ACCOUNTS || '').split(','),
}; 