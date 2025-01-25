import { z } from 'zod';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agentConfigSchema = z.object({
  username: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3010'),
  DATABASE_URL: z.string().url(),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  RPC_URL: z.string().url().default('https://auto-evm.taurus.autonomys.xyz/ws'),
  WS_RPC_URL: z.string().url().default('wss://auto-evm.taurus.autonomys.xyz/ws'),
  AGENTS: z.array(agentConfigSchema),
  DSN_API_KEY: z.string(),
  CORS_ORIGIN: z
    .union([
      z.string().url(),
      z
        .string()
        .transform(str => str.split(','))
        .pipe(z.array(z.string().url())),
      z.array(z.string().url()),
    ])
    .default(''),
  WS_PORT: z.string().transform(Number).default('3011'),
  OPENAI_API_KEY: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;

function loadAgentsConfig(): AgentConfig[] {
  try {
    const configPath = path.join(__dirname, './agents.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as { agents: AgentConfig[] };
    return config.agents;
  } catch (error) {
    console.error('Failed to load agents config:', error);
    throw new Error('Failed to load agents configuration');
  }
}

export function validateEnv(): EnvConfig {
  try {
    const agents = loadAgentsConfig();

    return envSchema.parse({
      ...process.env,
      AGENTS: agents,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(`Missing/invalid environment variables: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}
