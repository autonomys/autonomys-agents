import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.AGENTS_PORT || 3000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    dsnApiKey: process.env.DSN_API_KEY,
    autoConsensus: {
        apiKey: process.env.AUTO_CONSENSUS_API_KEY,
    },
    llmConfig: {
        temperature: 0.4,
        maxTokens: 1500
    }
}; 