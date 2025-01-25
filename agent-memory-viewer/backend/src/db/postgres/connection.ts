import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../../config/index.js';

const parseConnectionString = (url: string) => {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\//;
  const match = url.match(regex);
  if (!match) throw new Error('Invalid connection string');
  const [_, user, password, host, port] = match;
  return { user, password, host, port };
};

const { user, password, host, port } = parseConnectionString(config.DATABASE_URL || '');

export const pool = new Pool({
  user,
  password,
  host,
  port: parseInt(port),
  database: 'agent_memory',
}); 