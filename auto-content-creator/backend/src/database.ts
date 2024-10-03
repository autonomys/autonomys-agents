import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DATABASE_NAME || 'database.sqlite';
const db = new Database(dbName);

export const initializeDatabase = (): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      topic TEXT,
      contentType TEXT,
      finalContent TEXT,
      research TEXT,
      reflections TEXT,
      drafts TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const insertContent = (
  category: string,
  topic: string,
  contentType: string,
  finalContent: string,
  research: string,
  reflections: string,
  drafts: string
): number => {
  const stmt = db.prepare(`
    INSERT INTO content (category, topic, contentType, finalContent, research, reflections, drafts)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(category, topic, contentType, finalContent, research, reflections, drafts);
  return result.lastInsertRowid as number;
};

export const getContentById = (id: number): any => {
  const stmt = db.prepare('SELECT * FROM content WHERE id = ?');
  return stmt.get(id);
};

export const getAllContent = (page: number, limit: number): { contents: any[]; total: number } => {
  const offset = (page - 1) * limit;

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM content');
  const { total } = countStmt.get() as { total: number };

  const stmt = db.prepare(`
    SELECT * FROM content
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `);
  const contents = stmt.all(limit, offset);

  return { contents, total };
};
