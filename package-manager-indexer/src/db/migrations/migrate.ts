import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('db-migrations');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runMigrations = async () => {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
  });

  try {
    // Get all migration files
    const migrationFiles = await fs.readdir(__dirname);

    // Filter SQL files and sort them to ensure order
    const sqlFiles = migrationFiles.filter(file => file.endsWith('.sql')).sort();

    logger.info(`Found ${sqlFiles.length} migration files to run`);

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Get already applied migrations
    const { rows: appliedMigrations } = await pool.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map((row: { name: string }) => row.name);

    // Run migrations that haven't been applied yet
    for (const file of sqlFiles) {
      if (appliedMigrationNames.includes(file)) {
        logger.info(`Migration ${file} already applied. Skipping.`);
        continue;
      }

      logger.info(`Running migration: ${file}`);
      const filePath = path.join(__dirname, file);
      const sql = await fs.readFile(filePath, 'utf8');

      // Begin transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Run the migration
        await client.query(sql);

        // Record the migration
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

        await client.query('COMMIT');
        logger.info(`Successfully applied migration: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Failed to apply migration ${file}:`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
