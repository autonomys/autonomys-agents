import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.AGENTS_PORT || 3001,
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    environment: process.env.NODE_ENV || 'development',
    llmConfig: {
        temperature: 0.7,
        maxTokens: 2000
    }
}; 