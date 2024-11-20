import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    SUMMARY_FILE_PATH : path.join(process.cwd(), 'summary-differences.json'),
    CHECK_INTERVAL: 20 * 1000,
    SUMMARY_DIR: path.join(process.cwd(), 'diffs'),
    DIFF_FILE_PREFIX: 'summary-diff',
    LLM_MODEL: "gpt-4-turbo-preview",
    TEMPERATURE: 0.5,
    MNEMONIC: process.env.MNEMONIC || '//Alice',
    NETWORK: 'taurus',
    port: process.env.AGENTS_PORT || 3000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    dsnApiKey: process.env.DSN_API_KEY,
    autoConsensus: {
        apiKey: process.env.AUTO_CONSENSUS_API_KEY,
    },
}; 