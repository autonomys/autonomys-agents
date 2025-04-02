import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../../utils/logger.js';

export interface SqliteService {
  getDatabase(): Database.Database;
  closeDatabase(): void;
  ensureTable(tableName: string, schema: string, indexes?: string[]): void;
}

const logger = createLogger('sqlite-service');

export function createSqliteService(dbPath: string): SqliteService {
  const dbRef: { current: Database.Database | null } = { current: null };
  const initializedTables = new Set<string>();

  const ensureDatabaseDir = (): void => {
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info(`Created SQLite database directory: ${dbDir}`);
    }
  };

  const getDatabase = (): Database.Database => {
    if (dbRef.current) {
      return dbRef.current;
    }

    ensureDatabaseDir();

    logger.info(`Opening SQLite database at: ${dbPath}`);
    dbRef.current = new Database(dbPath);

    dbRef.current.pragma('foreign_keys = ON');

    return dbRef.current;
  };

  const ensureTable = (tableName: string, schema: string, indexes: string[] = []): void => {
    if (initializedTables.has(tableName)) {
      return;
    }

    const db = getDatabase();

    db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`);

    for (const indexSql of indexes) {
      db.exec(indexSql);
    }

    initializedTables.add(tableName);
    logger.info(`Initialized table: ${tableName}`);
  };

  const closeDatabase = (): void => {
    if (dbRef.current) {
      dbRef.current.close();
      dbRef.current = null;
      initializedTables.clear();
      logger.info('Closed SQLite database connection');
    }
  };

  return {
    getDatabase,
    closeDatabase,
    ensureTable,
  };
}
