import { VectorDB } from './VectorDB.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('vector-database-pool');

// A map to store VectorDB instances by namespace
const dbInstances: Map<string, VectorDB> = new Map();

/**
 * Get a VectorDB instance for a specific namespace
 * @param namespace The namespace for the VectorDB
 * @param maxElements Optional maximum number of elements
 * @returns A VectorDB instance
 */
export const getVectorDB = (namespace: string, maxElements?: number): VectorDB => {
  if (!dbInstances.has(namespace)) {
    logger.info(`Creating new VectorDB instance for namespace: ${namespace}`);
    const db = new VectorDB(namespace, maxElements);
    dbInstances.set(namespace, db);
  }
  const db = dbInstances.get(namespace);
  if (!db) {
    // This should not happen given the logic above, but handling for type safety
    throw new Error(`Failed to initialize or retrieve VectorDB for namespace: ${namespace}`);
  }
  return db;
};

/**
 * Close all database connections
 */
export const closeAllVectorDBs = (): void => {
  for (const [namespace, db] of dbInstances.entries()) {
    logger.info(`Closing VectorDB for namespace: ${namespace}`);
    db.close();
  }
  dbInstances.clear();
};

/**
 * Close a specific VectorDB instance
 * @param namespace The namespace of the VectorDB to close
 * @returns true if the instance was found and closed, false otherwise
 */
export const closeVectorDB = (namespace: string): boolean => {
  const db = dbInstances.get(namespace);
  if (db) {
    logger.info(`Closing VectorDB for namespace: ${namespace}`);
    db.close();
    dbInstances.delete(namespace);
    return true;
  }
  return false;
};

/**
 * Get all active VectorDB namespaces
 * @returns Array of active namespace strings
 */
export const getActiveVectorDBNamespaces = (): string[] => {
  return Array.from(dbInstances.keys());
};
