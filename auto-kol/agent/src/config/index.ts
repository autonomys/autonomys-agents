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
    TWITTER_USERNAME: process.env.TWITTER_USERNAME,
    TWITTER_PASSWORD: process.env.TWITTER_PASSWORD,

    // LLM Configuration
    LLM_MODEL: process.env.LLM_MODEL || "gpt-4o-mini",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TEMPERATURE: 0.7,

    // Agent Configuration
    CHECK_INTERVAL: (Number(process.env.CHECK_INTERVAL_MINUTES) || 30) * 60 * 1000,
    MEMORY_DIR: path.join(__dirname, '../../data/memory'),

    // Server Configuration
    PORT: process.env.PORT || 3001,

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Chroma Configuration
    CHROMA_DIR: path.join(__dirname, '../../data/chroma'),
    CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',

    // AutoDrive Configuration
    DSN_API_KEY: process.env.DSN_API_KEY,
    DSN_UPLOAD: process.env.DSN_UPLOAD === 'true',
    DSN_SKIP_UPLOAD: process.env.DSN_SKIP_UPLOAD === 'true',
    DSN_ENCRYPTION_PASSWORD: process.env.DSN_ENCRYPTION_PASSWORD,

    // CORS Configuration
    CORS_ORIGINS: process.env.CORS_ORIGINS,

    // SC Configuration
    RPC_URL: process.env.RPC_URL,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS,

    // Tweet Search/Fetch Configuration
    ACCOUNTS_PER_BATCH: Number(process.env.ACCOUNTS_PER_BATCH) || 10,
    MAX_SEARCH_TWEETS: Number(process.env.MAX_SEARCH_TWEETS) || 20,
    // BATCH CONFIG
    ENGAGEMENT_BATCH_SIZE: process.env.ENGAGEMENT_BATCH_SIZE || 15,

    // RESPONSE CONFIG
    RETRY_LIMIT: process.env.RETRY_LIMIT || 2,

    // POSTING TWEETS PERMISSION
    POST_TWEETS: process.env.POST_TWEETS === 'true',
}; 
