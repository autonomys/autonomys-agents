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
  private readonly indexFilePath: string;
  private readonly dbFilePath: string;
  private maxElements: number;
  private static readonly DEFAULT_MAX_ELEMENTS = 100000;

  constructor(namespace: string, maxElements?: number) {
    const targetDir = join(config.characterConfig.characterPath, 'data', namespace);

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    this.indexFilePath = join(targetDir, `${namespace}-index.bin`);
    this.dbFilePath = join(targetDir, `${namespace}-store.db`);
    this.maxElements = maxElements ?? VectorDB.DEFAULT_MAX_ELEMENTS;
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

    logger.info('VectorDB initialized successfully');
  }

  private createTables(): void {
    this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS embeddings_index USING vectorlite(
                embedding_vector float32[1536], 
                hnsw(max_elements=${this.maxElements}),
                '${this.indexFilePath}'
            );
            
            CREATE TABLE IF NOT EXISTS content_store (
                rowid INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT,
                created_at TEXT
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

  private async insertChunk(content: string, timestamp: string): Promise<boolean> {
    const embedding = await this.getEmbedding(content);

    this.db.exec('BEGIN IMMEDIATE');
    try {
      // Check if we've reached the maximum number of elements
      const countResult = this.db.prepare('SELECT COUNT(*) as count FROM content_store').get() as {
        count: number;
      };

      if (countResult.count >= this.maxElements) {
        // Delete the oldest record to make room
        const oldestRowId = this.db
          .prepare('SELECT MIN(rowid) as min_id FROM content_store')
          .get() as { min_id: number };
        const oldestId = Number(oldestRowId.min_id);

        try {
          this.db.exec(`DELETE FROM embeddings_index WHERE rowid = ${oldestId}`);
          this.db.exec(`DELETE FROM content_store WHERE rowid = ${oldestId}`);
        } catch (deleteError) {
          logger.error('Error during delete:', deleteError);
          throw deleteError;
        }
      }

      // Insert into content_store first and get the AUTOINCREMENT rowid
      const contentStatement = this.db.prepare(`
                INSERT INTO content_store (content, created_at)
                VALUES (?, ?)
            `);

      const contentResult = contentStatement.run(content, timestamp);
      const newRowId = contentResult.lastInsertRowid;

      // Now insert into embeddings_index with the same rowid
      const vectorStatement = this.db.prepare(`
                INSERT INTO embeddings_index (rowid, embedding_vector) 
                VALUES (?, ?)
            `);

      vectorStatement.run(newRowId, Buffer.from(new Float32Array(embedding).buffer));

      logger.info('Inserted content with rowid:', { rowid: newRowId, content });
      this.db.exec('COMMIT');
    } catch (error) {
      logger.error('Error during insert:', error);
      this.db.exec('ROLLBACK');
      throw error;
    }

    return true;
  }

  async insert(content: string, timestamp?: string): Promise<boolean> {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Define max chunk size (approximately 7000 tokens, using ~4 chars per token estimate)
    const MAX_CHUNK_SIZE = 28000;
    const createdAt = timestamp ?? new Date().toISOString();

    // If content is within limits, process normally
    if (content.length <= MAX_CHUNK_SIZE) {
      return this.insertChunk(content, createdAt);
    }

    // For long content, split into chunks and insert each
    logger.info(`Content length ${content.length} exceeds limit. Splitting into chunks.`);
    let position = 0;
    let chunkCount = 0;
    let success = true;

    while (position < content.length) {
      const chunkEnd = Math.min(position + MAX_CHUNK_SIZE, content.length);
      const chunk = content.substring(position, chunkEnd);
      chunkCount++;

      // Add chunk number to metadata in content
      const chunkContent = `[Chunk ${chunkCount}] ${chunk}`;

      try {
        const result = await this.insertChunk(chunkContent, createdAt);
        if (!result) {
          success = false;
        }
      } catch (error) {
        logger.error(`Error inserting chunk ${chunkCount}:`, error);
        success = false;
      }

      position = chunkEnd;
    }

    logger.info(`Split content into ${chunkCount} chunks`);
    return success;
  }

  async search(params: {
    query: string;
    metadataFilter?: string;
    limit?: number;
  }): Promise<Array<{ rowid: number; distance: number; content: string; created_at: string }>> {
    const { query, metadataFilter, limit = 5 } = params;

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const embedding = await this.getEmbedding(query);
    const integerLimit = parseInt(String(limit), 10);

    // Base query that's common to both cases
    let queryString = `
      SELECT v.rowid, v.distance, c.content, c.created_at
      FROM (
          SELECT rowid, distance 
          FROM embeddings_index 
          WHERE knn_search(embedding_vector, knn_param(?, ${integerLimit}))
      ) v
      JOIN content_store c ON v.rowid = c.rowid
    `;

    if (metadataFilter) {
      logger.info(`Searching with metadata filter with limit: ${integerLimit}`);

      // Get candidate rows that match the metadata filter
      const candidateStatement = this.db.prepare(
        `SELECT rowid FROM content_store WHERE ${metadataFilter}`,
      );
      const candidateRows = candidateStatement.all() as Array<{ rowid: number }>;

      if (candidateRows.length === 0) {
        return [];
      }

      const candidateListStr = candidateRows.map(row => row.rowid).join(',');
      // Append the WHERE clause to filter by candidate rows
      queryString += ` WHERE c.rowid IN (${candidateListStr})`;
    }

    const statement = this.db.prepare(queryString);
    return statement.all(Buffer.from(new Float32Array(embedding).buffer)) as Array<{
      rowid: number;
      distance: number;
      content: string;
      created_at: string;
    }>;
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  public isOpen(): boolean {
    return this.db && !this.db.open === false;
  }

  public async open(): Promise<void> {
    if (!this.isOpen()) {
      logger.info('Opening VectorDB connection');
      this.initializeDatabase();
      logger.info('VectorDB opened successfully');
    }
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
