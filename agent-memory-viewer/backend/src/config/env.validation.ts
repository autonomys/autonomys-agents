import { z } from 'zod';

const envSchema = z.object({
  AGENT_USERNAME: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3010'),
  DATABASE_URL: z.string().url(),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  RPC_URL: z.string().url().default('https://auto-evm.taurus.autonomys.xyz/ws'),
  WS_RPC_URL: z.string().url().default('wss://auto-evm.taurus.autonomys.xyz/ws'),
  AGENT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  DSN_API_KEY: z.string(),
  CORS_ORIGIN: z.union([
    z.string().url(),
    z.string().transform(str => str.split(',')).pipe(z.array(z.string().url())),
    z.array(z.string().url())
  ]).default(''),
  WS_PORT: z.string().transform(Number).default('3011')
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(`Missing/invalid environment variables: ${missingVars.join(', ')}`);
    }
    throw error;
  }
} 