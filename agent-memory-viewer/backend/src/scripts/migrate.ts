import { pool } from '../db/index.js';
import { createLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('migration');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/001_add_agent_name.sql');
    const migration = await fs.readFile(migrationPath, 'utf8');

    await pool.query(migration);
    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

runMigration().catch(console.error);
