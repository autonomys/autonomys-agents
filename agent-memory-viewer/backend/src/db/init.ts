import { createPool } from './postgres/connection.js';
import * as fs from 'fs/promises';
import { createLogger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('db');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, 'schema.sql');

const initPool = createPool('postgres');

async function checkDatabaseExists(): Promise<boolean> {
  try {
    const result = await initPool.query("SELECT 1 FROM pg_database WHERE datname = 'agent_memory'");
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking database existence:', error);
    throw error;
  }
}

async function initializeDatabase() {
  const exists = await checkDatabaseExists();

  if (!exists) {
    try {
      await initPool.query(`CREATE DATABASE agent_memory;`);
      logger.info('Database created successfully');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await initializeTables();
    } catch (error: any) {
      logger.error('Error creating database:', error);
      throw error;
    }
  } else {
    logger.info('Database already exists, skipping initialization');
  }

  await initPool.end();
}

async function initializeTables() {
  const dbPool = createPool('agent_memory');

  try {
    const schema = await fs.readFile(schemaPath, 'utf8');
    await dbPool.query(schema);
    logger.info('Tables created successfully');
  } catch (error) {
    logger.error('Error creating tables:', error);
    throw error;
  } finally {
    await dbPool.end();
  }
}

export async function initialize() {
  await initializeDatabase();
}

export async function resetDatabase() {
  const initPool = createPool('postgres');

  try {
    await initPool.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'agent_memory'
            AND pid <> pg_backend_pid();
        `);

    await initPool.query('DROP DATABASE IF EXISTS agent_memory;');
    await initPool.query('CREATE DATABASE agent_memory;');
    logger.info('Database reset successfully');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const dbPool = createPool('agent_memory');

    try {
      const schema = await fs.readFile(schemaPath, 'utf8');
      await dbPool.query(schema);
      logger.info('Tables recreated successfully');
    } finally {
      await dbPool.end();
    }
  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  } finally {
    await initPool.end();
  }
}
