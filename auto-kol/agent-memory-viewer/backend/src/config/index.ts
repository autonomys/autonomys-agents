import 'dotenv/config';

export const config = {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    RPC_URL: process.env.RPC_URL,
    AGENT_ADDRESS: process.env.AGENT_ADDRESS,
    DSN_API_KEY: process.env.DSN_API_KEY
}; 