import pkg from 'pg';
const { Pool } = pkg;

import { config } from '../config/index.js';

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

export interface MemoryRecord {
    id: number;
    cid: string;
    content: any;
    created_at: Date;
}

export async function saveMemoryRecord(cid: string, content: any, previous_cid: string): Promise<MemoryRecord> {
    const result = await pool.query(
        'INSERT INTO memory_records (cid, content, previous_cid) VALUES ($1, $2, $3) RETURNING *',
        [cid, JSON.stringify(content), previous_cid]
    );
    return result.rows[0];
}

export async function getMemoryByCid(cid: string): Promise<MemoryRecord | null> {
    const result = await pool.query(
        'SELECT * FROM memory_records WHERE cid = $1',
        [cid]
    );
    return result.rows[0] || null;
}

export async function getAllDsn(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    try {
        const countResult = await pool.query('SELECT COUNT(*) FROM memory_records');
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT 
                mr.id,
                mr.cid,
                mr.previous_cid,
                mr.content,
                mr.created_at
            FROM memory_records mr
            ORDER BY mr.created_at DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const transformedData = result.rows.map(record => {
            try {
                const content = record.content || {};
                return {
                    id: record.id,
                    tweet_id: content.tweet?.id || null,
                    cid: record.cid,
                    created_at: record.created_at,
                    author_username: content.tweet?.author_username || null,
                    tweet_content: content.tweet?.text || null,
                    response_content: content.type === 'response' ? content.response || null : null,
                    result_type: content.type || 'unknown',
                    skip_reason: content.type === 'skipped' ? content.workflowState?.decision?.reason || null : null,
                    response_status: content.type === 'response' ? 'pending' : null
                };
            } catch (error) {
                console.error('Error transforming record:', error, 'Record:', record);
                // Return a safe default object if transformation fails
                return {
                    id: record.id,
                    tweet_id: null,
                    cid: record.cid,
                    created_at: record.created_at,
                    author_username: null,
                    tweet_content: null,
                    response_content: null,
                    result_type: 'error',
                    skip_reason: 'Error processing record',
                    response_status: null
                };
            }
        });

        return {
            data: transformedData,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Failed to get all DSN records:', error);
        throw error;
    }
}