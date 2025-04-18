import { pool } from '../db/connection.js';
import { createLogger } from '../utils/logger.js';
import { resetLastProcessedBlock } from '../db/repositories/toolRepository.js';

const logger = createLogger('reset-database');

/**
 * Script to completely reset the database by truncating all tables
 * This preserves the schema but removes all data
 */
const resetDatabase = async () => {
  try {
    logger.info('Starting database reset...');

    // Disable foreign key checks before truncating
    await pool.query('SET session_replication_role = replica;');

    // Truncate all tables (except the migration tables)
    await pool.query(`
      TRUNCATE TABLE 
        tools,
        tool_versions,
        indexer_state
      RESTART IDENTITY CASCADE;
    `);

    // Re-enable foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');

    // Reset the indexer state with block 0
    await resetLastProcessedBlock(0);

    logger.info('Database successfully reset. All data has been removed.');
    logger.info('Indexer will start from the configured START_BLOCK on next run.');

    process.exit(0);
  } catch (error) {
    logger.error('Error resetting database:', error);
    process.exit(1);
  }
};

// Run the reset function
resetDatabase();
