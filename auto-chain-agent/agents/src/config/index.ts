import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    CHECK_INTERVAL: 20 * 1000,
    SUMMARY_DIR: path.join(process.cwd(), 'diffs'),
    SUMMARY_FILE_PATH : path.join(process.cwd(), 'diffs', 'summary-differences.json'),
    DIFF_FILE_PREFIX: 'summary-diff',
    LLM_MODEL: "gpt-4o-mini",
    TEMPERATURE: 0.5,
    AGENT_KEY: process.env.AGENT_KEY || '//Alice',
    NETWORK: 'taurus',
    port: process.env.AGENTS_PORT || 3000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    dsnApiKey: process.env.DSN_API_KEY,
}; 