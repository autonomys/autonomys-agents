import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.AGENTS_PORT || 3000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    llmConfig: {
        generation: {
            temperature: 0.7,
            maxTokens: 2000
        },
        reflection: {
            temperature: 0.2,
            maxTokens: 1000
        },
        research: {
            temperature: 0.2,
            maxTokens: 1000
        },
        feedback: {
            temperature: 0.4,
            maxTokens: 1500
        }
    }
}; 