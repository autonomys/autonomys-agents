import { pool } from '../db/index.js';
import { createLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('rename-agent-migration');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renameArgumintAgent() {
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/003_rename_argumint_agent.sql');
    const migration = await fs.readFile(migrationPath, 'utf8');

    // Get count of records before update
    const countBefore = await pool.query("SELECT COUNT(*) FROM memory_records WHERE agent_name = '0xargumint'");
    logger.info(`Found ${countBefore.rows[0].count} records with agent_name = '0xargumint'`);

    // Run the migration
    await pool.query(migration);
    
    // Get count of records after update
    const countAfter = await pool.query("SELECT COUNT(*) FROM memory_records WHERE agent_name = 'argumint'");
    logger.info(`Updated ${countAfter.rows[0].count} records to agent_name = 'argumint'`);
    
    logger.info('Migration completed successfully');
    
    // Also update any references to the agent in the config
    // This would need to be done separately for the config.yaml file
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

renameArgumintAgent().catch(error => {
  console.error('Error running migration:', error);
  process.exit(1);
}); 