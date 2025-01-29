import Database from 'better-sqlite3';
import vectorlite from 'vectorlite';
import { OpenAI } from 'openai';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const logger = createLogger('vector-database');

export class VectorDB {
  private db!: Database.Database;
  private openai!: OpenAI;
  private nextRowId!: number;
  private readonly indexFilePath: string;
  private readonly dbFilePath: string;
  private maxElements: number;
  private static readonly DEFAULT_INDEX_FILE = 'index_file.bin';
  private static readonly DEFAULT_DB_FILE = 'vector_store.db';
  private static readonly DEFAULT_DATA_DIR = join(
    config.characterConfig.characterPath,
    'data',
    'vector-db',
  );

  constructor(
    dataDir?: string,
    indexFilePath: string = VectorDB.DEFAULT_INDEX_FILE,
    dbFilePath: string = VectorDB.DEFAULT_DB_FILE,
    maxElements: number = 100000,
  ) {
    const targetDir = dataDir
      ? join(config.characterConfig.characterPath, dataDir)
      : VectorDB.DEFAULT_DATA_DIR;

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    this.indexFilePath = join(targetDir, indexFilePath);
    this.dbFilePath = join(targetDir, dbFilePath);
    this.nextRowId = 1;
    this.maxElements = maxElements;
    this.openai = new OpenAI({
      apiKey: config.llmConfig.OPENAI_API_KEY,
    });

    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const extensionPath = vectorlite.vectorlitePath();
    logger.info('Initializing VectorDB', {
      extensionPath,
      dbExists: existsSync(this.dbFilePath),
      indexExists: existsSync(this.indexFilePath),
    });

    this.db = new Database(this.dbFilePath);
    this.db.loadExtension(extensionPath);
    logger.info('Vectorlite loaded successfully!');

    this.createTables();

    if (!existsSync(this.indexFilePath)) {
      const initialEmbedding = new Array(1536).fill(0);
      this.db.exec('BEGIN');
      try {
        this.db
          .prepare(
            `
                INSERT INTO embeddings_index (rowid, embedding_vector) 
                VALUES (?, ?)
            `,
          )
          .run(0, Buffer.from(new Float32Array(initialEmbedding).buffer));

        this.db.exec('DELETE FROM embeddings_index WHERE rowid = 0');
        this.db.exec('COMMIT');
        this.db.close();
        this.db = new Database(this.dbFilePath);
        this.db.loadExtension(extensionPath);
      } catch (error) {
        logger.error('Error initializing bin file:', error);
        this.db.exec('ROLLBACK');
        throw error;
      }
    }

    const maxRowIdResult = this.db
      .prepare('SELECT MAX(rowid) as maxId FROM content_store')
      .get() as { maxId: number | null };
    this.nextRowId = (maxRowIdResult?.maxId || 0) + 1;
    logger.info(`Initialized with next rowid: ${this.nextRowId}`);
  }

  private createTables(): void {
    this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS embeddings_index USING vectorlite(
                embedding_vector float32[1536], 
                hnsw(max_elements=${this.maxElements}),
                '${this.indexFilePath}'
            );
            
            CREATE TABLE IF NOT EXISTS content_store (
                rowid INTEGER PRIMARY KEY,
                content TEXT
            );
        `);
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error getting embedding:', error);
      throw error;
    }
  }

  async insert(content: string): Promise<boolean> {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    const embedding = await this.getEmbedding(content);

    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (this.nextRowId > this.maxElements) {
        const oldestRowId = this.db
          .prepare(
            `
                    SELECT MIN(rowid) as min_id FROM content_store
                `,
          )
          .get() as { min_id: number };
        const oldestId = Number(oldestRowId.min_id);

        try {
          this.db.exec(`DELETE FROM embeddings_index WHERE rowid = ${oldestId}`);
          this.db.exec(`DELETE FROM content_store WHERE rowid = ${oldestId}`);
        } catch (deleteError) {
          logger.error('Error during delete:', deleteError);
          throw deleteError;
        }

        this.nextRowId = oldestId;
      }

      const currentRowId = Number(this.nextRowId);
      const vectorStatement = this.db.prepare(`
                INSERT INTO embeddings_index (rowid, embedding_vector) 
                VALUES (?, ?)
            `);

      const contentStatement = this.db.prepare(`
                INSERT INTO content_store (rowid, content)
                VALUES (?, ?)
            `);

      vectorStatement.run(currentRowId, Buffer.from(new Float32Array(embedding).buffer));

      contentStatement.run(currentRowId, content);
      logger.info('Inserted content:', { content });
      this.nextRowId++;
      this.db.exec('COMMIT');
    } catch (error) {
      logger.error('Error during insert:', error);
      this.db.exec('ROLLBACK');
      throw error;
    }

    return true;
  }

  async search(
    content: string,
    limit: number = 5,
  ): Promise<Array<{ rowid: number; distance: number; content: string }>> {
    if (!content || content.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const embedding = await this.getEmbedding(content);

    const integerLimit = parseInt(limit.toString(), 10);
    logger.info(`Searching with limit: ${integerLimit}`);

    const statement = this.db.prepare(`
            SELECT v.rowid, v.distance, c.content
            FROM (
                SELECT rowid, distance 
                FROM embeddings_index 
                WHERE knn_search(embedding_vector, knn_param(?, ${integerLimit}))
            ) v
            JOIN content_store c ON v.rowid = c.rowid
        `);

    return statement.all(Buffer.from(new Float32Array(embedding).buffer)) as Array<{
      rowid: number;
      distance: number;
      content: string;
    }>;
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  public close(): void {
    logger.info('Closing VectorDB connection');
    if (this.db) {
      try {
        this.db.exec('COMMIT');
      } catch {}
      this.db.close();
      logger.info('VectorDB closed successfully');
    }
  }
}
