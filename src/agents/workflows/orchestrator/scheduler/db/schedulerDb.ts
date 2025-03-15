import path from 'path';
import { createSqliteService } from '../../../../../services/sqlite/SqliteDB.js';
import { config } from '../../../../../config/index.js';
import { SchedulerDatabase } from '../types.js';
import { createTaskTableIndexes, TASKS_TABLE_SCHEMA } from './schema.js';

let schedulerDbInstance: SchedulerDatabase | null = null;

export function createSchedulerDatabase(): SchedulerDatabase {
  if (schedulerDbInstance) {
    return schedulerDbInstance;
  }

  const dbPath = path.join(config.characterConfig.characterPath, 'data', 'scheduler.db');

  const sqliteService = createSqliteService(dbPath);
  const getTableName = (namespace: string): string => {
    return `tasks_${namespace}`;
  };

  const ensureNamespaceTable = (namespace: string): void => {
    const tableName = getTableName(namespace);
    sqliteService.ensureTable(tableName, TASKS_TABLE_SCHEMA, createTaskTableIndexes(namespace));
  };

  const schedulerDb: SchedulerDatabase = {
    getSqliteService: () => sqliteService,
    getTableName,
    ensureNamespaceTable,
    closeDatabase: () => sqliteService.closeDatabase(),
  };

  schedulerDbInstance = schedulerDb;

  return schedulerDb;
}

export function getSchedulerDatabase(): SchedulerDatabase {
  if (!schedulerDbInstance) {
    schedulerDbInstance = createSchedulerDatabase();
  }
  return schedulerDbInstance;
}
