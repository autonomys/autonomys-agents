import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../../logger';

export const initializeDb = async (dbPath: string) => {
    logger.info('Initializing SQLite database at:', dbPath);
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS threads (
            thread_id TEXT PRIMARY KEY,
            messages TEXT NOT NULL,
            tool_calls TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS summary_uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            upload_id TEXT NOT NULL,
            CID TEXT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    return db;
};