import Database from "better-sqlite3";
import vectorlite from "vectorlite";
import { OpenAI } from "openai";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger('vecdb');

export class VectorDB {
    private db!: Database.Database;
    private openai!: OpenAI;
    private nextRowId!: number;
    private readonly indexFilePath: string;

    constructor(indexFilePath: string = "index_file.bin") {
        this.indexFilePath = indexFilePath;
        this.nextRowId = 1;
        this.openai = new OpenAI({
            apiKey: config.llmConfig.OPENAI_API_KEY,
        });
        
        this.initializeDatabase();
    }

    private initializeDatabase(): void {
        const extensionPath = vectorlite.vectorlitePath();
        logger.info("Vectorlite extension path:", extensionPath);

        this.db = new Database(":memory:");
        this.db.loadExtension(extensionPath);
        logger.info("Vectorlite loaded successfully!");

        this.createTables();
    }

    private createTables(): void {
        this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS my_table USING vectorlite(
                my_embedding float32[1536], 
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
                INSERT INTO my_table (rowid, my_embedding) 
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
                FROM my_table 
                WHERE knn_search(my_embedding, knn_param(?, ${integerLimit}))
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