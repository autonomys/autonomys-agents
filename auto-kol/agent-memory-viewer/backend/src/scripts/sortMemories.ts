import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('sort-memories');

const parseConnectionString = (url: string) => {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\//;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid connection string');
    const [_, user, password, host, port] = match;
    return { user, password, host, port };
};

const { user, password, host, port } = parseConnectionString(config.DATABASE_URL || '');

const pool = new Pool({
    user,
    password,
    host,
    port: parseInt(port),
    database: 'agent_memory'
});

async function sortMemories() {
    try {
        logger.info('Starting memory sorting process...');
        
        const startTime = Date.now();
        
        // Create temporary table with sorted data using timestamp from content
        await pool.query(`
            CREATE TEMP TABLE sorted_memories AS
            SELECT * FROM memory_records
            ORDER BY (content->>'timestamp')::timestamp DESC NULLS LAST;
        `);
        
        // Clear and repopulate the original table
        await pool.query('BEGIN');
        
        await pool.query('DELETE FROM memory_records');
        
        await pool.query(`
            INSERT INTO memory_records 
            SELECT * FROM sorted_memories;
        `);
        
        await pool.query('DROP TABLE sorted_memories');
        
        await pool.query('COMMIT');
        
        const duration = Date.now() - startTime;
        logger.info('Memory sorting completed', { 
            durationMs: duration 
        });
        
    } catch (error) {
        logger.error('Error sorting memories:', error);
        await pool.query('ROLLBACK');
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the sort
sortMemories().catch(error => {
    logger.error('Fatal error during sorting:', error);
    process.exit(1);
}); 