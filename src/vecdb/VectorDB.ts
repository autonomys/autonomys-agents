import Database from "better-sqlite3";
import vectorlite from "vectorlite";
import { OpenAI } from "openai";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger('vector-database');

export class VectorDB {
    private db!: Database.Database;
    private openai!: OpenAI;
    private nextRowId!: number;
    private readonly indexFilePath: string;
    private readonly dbFilePath: string;

    constructor(indexFilePath: string = "index_file.bin", dbFilePath: string = "vector_store.db") {
        this.indexFilePath = indexFilePath;
        this.dbFilePath = dbFilePath;
        this.nextRowId = 1;
        this.openai = new OpenAI({
            apiKey: config.llmConfig.OPENAI_API_KEY,
        });
        
        this.initializeDatabase();
    }

    private initializeDatabase(): void {
        const extensionPath = vectorlite.vectorlitePath();
        logger.info("Vectorlite extension path:", extensionPath);

        this.db = new Database(this.dbFilePath);
        this.db.loadExtension(extensionPath);
        logger.info("Vectorlite loaded successfully!");

        this.createTables();
        
        const maxRowIdResult = this.db.prepare(`
            SELECT MAX(rowid) as maxId FROM content_store
        `).get() as { maxId: number | null };
        this.nextRowId = (maxRowIdResult?.maxId || 0) + 1;
        logger.info(`Initialized with next rowid: ${this.nextRowId}`);
    }

    private createTables(): void {
        this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS embeddings_index USING vectorlite(
                embedding_vector float32[1536], 
                hnsw(max_elements=100000),
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
                model: "text-embedding-ada-002",
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            logger.error("Error getting embedding:", error);
            throw error;
        }
    }

    async insert(content: string, metadata: any = {}): Promise<boolean> {
        const embedding = await this.getEmbedding(content);
        
        this.db.exec('BEGIN');
        try {
            const vectorStmt = this.db.prepare(`
                INSERT INTO embeddings_index (rowid, embedding_vector) 
                VALUES (?, ?)
            `);
            
            const contentStmt = this.db.prepare(`
                INSERT INTO content_store (rowid, content)
                VALUES (?, ?)
            `);
            
            vectorStmt.run(
                this.nextRowId,
                Buffer.from(new Float32Array(embedding).buffer)
            );
            
            contentStmt.run(this.nextRowId, content);
            
            this.nextRowId++;
            this.db.exec('COMMIT');
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
        
        return true;
    }

    async search(content: string, limit: number = 5): Promise<Array<{ rowid: number, distance: number, content: string }>> {
        const embedding = await this.getEmbedding(content);
        
        const integerLimit = parseInt(limit.toString(), 10);
        logger.info(`Searching with limit: ${integerLimit}`);

        const stmt = this.db.prepare(`
            SELECT v.rowid, v.distance, c.content
            FROM (
                SELECT rowid, distance 
                FROM embeddings_index 
                WHERE knn_search(embedding_vector, knn_param(?, ${integerLimit}))
            ) v
            JOIN content_store c ON v.rowid = c.rowid
        `);
        
        return stmt.all(
            Buffer.from(new Float32Array(embedding).buffer)
        ) as Array<{ rowid: number, distance: number, content: string }>;
    }

    getDatabase(): Database.Database {
        return this.db;
    }
} 