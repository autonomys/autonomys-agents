import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.AGENTS_PORT || 3001,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    walletMnemonic: process.env.WALLET_MNEMONIC,
    networkId: process.env.NETWORK_ID || 'gemini-3h',
    model: 'gpt-4',
    environment: process.env.NODE_ENV || 'development',
    llmConfig: {
        temperature: 0.7,
        maxTokens: 2000
    }
}; 