#!/usr/bin/env ts-node

/**
 * Vector Database Migration Script
 *
 * This script migrates existing vector databases from using TEXT format for created_at
 * to using the SQLite DATETIME format.
 *
 * Usage:
 *   yarn migrate:vector-db [character-name] [namespace]
 *
 * Parameters:
 *   character-name: The name of the character whose databases to migrate.
 *                   If not provided, uses the default character from config.
 *   namespace:      (Optional) The specific namespace to migrate (e.g., "experiences").
 *                   If not provided, all namespaces for the character will be migrated.
 *
 * Examples:
 *   yarn migrate:vector-db alice               # Migrate all namespaces for character "alice"
 *   yarn migrate:vector-db alice experiences   # Migrate only "experiences" namespace for "alice"
 */

import { join, basename } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync, renameSync } from 'fs';
import Database from 'better-sqlite3';
import { config } from '../core/config/index.js';
import { createLogger } from '../core/utils/logger.js';

const logger = createLogger('vector-db-migration');

const targetNamespace = process.argv[3];

// Function to migrate a single vector database
const migrateVectorDb = async (namespace: string = 'experiences'): Promise<boolean> => {
  logger.info(
    `Starting migration for character: ${config.characterConfig.name}, namespace: ${namespace}`,
  );

  const dataDir = join(config.characterConfig.characterPath, 'data', namespace);
  const dbFilePath = join(dataDir, `${namespace}-store.db`);

  // Check if the database exists
  if (!existsSync(dbFilePath)) {
    logger.error(`Database file not found for namespace: ${namespace}`);
    return false;
  }

  // Open the original database to check schema and extract data
  let sourceDb: Database.Database;
  try {
    sourceDb = new Database(dbFilePath);
    logger.info('Opened source database');
  } catch (error: any) {
    logger.error(`Failed to open source database: ${error.message || String(error)}`);
    return false;
  }

  // Check if migration is needed
  try {
    const tableInfo = sourceDb.prepare('PRAGMA table_info(content_store)').all() as any[];
    const createdAtColumn = tableInfo.find(col => col.name === 'created_at');

    if (!createdAtColumn) {
      logger.error('created_at column not found in content_store table');
      sourceDb.close();
      return false;
    }

    if (createdAtColumn.type === 'DATETIME') {
      logger.info('Database already uses DATETIME type for created_at. No migration needed.');
      sourceDb.close();
      return true;
    }

    logger.info(`Current created_at type: ${createdAtColumn.type}, proceeding with migration`);
  } catch (error: any) {
    logger.error(`Failed to check table schema: ${error.message || String(error)}`);
    sourceDb.close();
    return false;
  }

  // Create backup directory - only if migration is needed
  const backupDir = join(dataDir, 'backup-' + new Date().toISOString().replace(/:/g, '-'));
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  // Backup the original files
  const dbBackupPath = join(backupDir, basename(dbFilePath));

  try {
    copyFileSync(dbFilePath, dbBackupPath);
    logger.info(`Created backup in: ${backupDir}`);
  } catch (error: any) {
    logger.error(`Failed to create backup: ${error.message || String(error)}`);
    return false;
  }

  // Extract data from content_store
  let records: any[] = [];
  try {
    records = sourceDb.prepare('SELECT rowid, content, created_at FROM content_store').all();
    logger.info(`Retrieved ${records.length} records from content_store table`);
  } catch (error: any) {
    logger.error(`Failed to extract data: ${error.message || String(error)}`);
    sourceDb.close();
    return false;
  }

  // Create a temporary database for the migration
  const tempDbPath = join(dataDir, `${namespace}-store-new.db`);
  let targetDb: Database.Database | undefined;

  try {
    // Remove existing temp file if it exists
    if (existsSync(tempDbPath)) {
      logger.info(`Removing existing temp database: ${tempDbPath}`);
    }

    targetDb = new Database(tempDbPath);
    logger.info('Created new database for migration');

    // Begin transaction
    targetDb.exec('BEGIN TRANSACTION');

    // Create content_store with DATETIME type
    targetDb.exec(`
      CREATE TABLE content_store (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        created_at DATETIME
      )
    `);

    // Migrate data from content_store with formatted timestamps
    const insertStmt = targetDb.prepare(`
      INSERT INTO content_store (rowid, content, created_at)
      VALUES (?, ?, datetime(?))
    `);

    for (const record of records) {
      // Format the timestamp for SQLite DATETIME
      let timestamp = record.created_at;
      if (timestamp && timestamp.includes('T')) {
        // Convert ISO format to SQLite format
        timestamp = timestamp.replace('T', ' ').split('.')[0];
      }

      insertStmt.run(record.rowid, record.content, timestamp);
    }

    targetDb.exec('COMMIT');
    logger.info(`Successfully migrated ${records.length} records to the new database`);
  } catch (error: any) {
    logger.error(`Failed to create or populate new database: ${error.message || String(error)}`);
    if (targetDb) {
      targetDb.exec('ROLLBACK');
      targetDb.close();
    }
    sourceDb.close();
    return false;
  }

  // Close databases
  sourceDb.close();
  if (targetDb) targetDb.close();

  // Rename the original database to preserve it
  const originalDbBackupPath = join(dataDir, `${namespace}-store-original.db`);
  try {
    renameSync(dbFilePath, originalDbBackupPath);
    logger.info(`Renamed original database to: ${originalDbBackupPath}`);
  } catch (error: any) {
    logger.error(`Failed to rename original database: ${error.message || String(error)}`);
    return false;
  }

  // Rename the new database to the original name
  try {
    renameSync(tempDbPath, dbFilePath);
    logger.info('Successfully replaced original database with migrated version');
    return true;
  } catch (error: any) {
    logger.error(`Failed to rename new database: ${error.message || String(error)}`);
    // Try to restore the original database
    try {
      renameSync(originalDbBackupPath, dbFilePath);
      logger.info('Restored original database after failed migration');
    } catch (restoreError: any) {
      logger.error(
        `Failed to restore original database: ${restoreError.message || String(restoreError)}`,
      );
    }
    return false;
  }
};

// Main function to run the migration
async function main() {
  logger.info(`Starting vector database migration for character: ${config.characterConfig.name}`);

  if (targetNamespace) {
    // Migrate a specific namespace
    const success = await migrateVectorDb(targetNamespace);
    if (success) {
      logger.info(`Successfully migrated namespace: ${targetNamespace}`);
    } else {
      logger.error(`Failed to migrate namespace: ${targetNamespace}`);
      process.exit(1);
    }
  } else {
    // Migrate all namespaces
    const dataDir = join(config.characterConfig.characterPath, 'data');
    if (!existsSync(dataDir)) {
      logger.error(`Data directory not found: ${dataDir}`);
      process.exit(1);
    }

    const namespaces = readdirSync(dataDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    logger.info(`Found ${namespaces.length} namespaces to migrate`);

    let successCount = 0;
    let failCount = 0;

    for (const namespace of namespaces) {
      const success = await migrateVectorDb(namespace);
      if (success) {
        successCount++;
        logger.info(`Successfully migrated namespace: ${namespace}`);
      } else {
        failCount++;
        logger.error(`Failed to migrate namespace: ${namespace}`);
      }
    }

    logger.info(`Migration complete. Success: ${successCount}, Failed: ${failCount}`);

    if (failCount > 0) {
      process.exit(1);
    }
  }

  logger.info('Migration completed successfully');
}

// Run the main function
main().catch((error: any) => {
  logger.error('Unhandled error during migration:', error.message || String(error));
  process.exit(1);
});
