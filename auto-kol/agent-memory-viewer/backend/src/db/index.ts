import pkg from 'pg';
const { Pool } = pkg;

import { config } from '../config/index.js';
import { broadcastNewMemory } from '../websocket.js';
import { ResponseStatus } from '../types/enums.js';

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
    try {
        const result = await pool.query(
            'INSERT INTO memory_records (cid, content, previous_cid) VALUES ($1, $2, $3) RETURNING *',
            [cid, JSON.stringify(content), previous_cid]
        );
        broadcastNewMemory(result.rows[0]);
        return result.rows[0];
    } catch (error: any) {
        if (error.code === '23505') { 
            const existingRecord = await pool.query(
                'SELECT * FROM memory_records WHERE cid = $1',
                [cid]
            );
            return existingRecord.rows[0];
        }
        throw error;
    }
}

export async function getMemoryByCid(cid: string): Promise<MemoryRecord | null> {
    const result = await pool.query(
        'SELECT * FROM memory_records WHERE cid = $1',
        [cid]
    );
    return result.rows[0] || null;
}

export async function getAllDsn(
    page: number, 
    limit: number, 
    type?: ResponseStatus,
    searchText?: string,
    authorUsername?: string
): Promise<any> {
    const offset = (page - 1) * limit;
    
    try {
        let countQuery = 'SELECT COUNT(*) FROM memory_records';
        let params: any[] = [];
        let conditions: string[] = [];
        
        if (type) {
            conditions.push(`content->>'type' = $${params.length + 1}`);
            params.push(type);
        }

        if (searchText) {
            conditions.push(`(
                content->'tweet'->>'text'::text ILIKE $${params.length + 1} 
                OR content->>'response'::text ILIKE $${params.length + 1}
            )`);
            params.push(`%${searchText}%`);
        }

        if (authorUsername) {
            conditions.push(`content->'tweet'->>'author_username'::text ILIKE $${params.length + 1}`);
            params.push(`%${authorUsername}%`);
        }

        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        let query = `
            SELECT 
                mr.id,
                mr.cid,
                mr.previous_cid,
                mr.content,
                mr.created_at
            FROM memory_records mr`;
            
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ` ORDER BY mr.created_at DESC
                  LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        const queryParams = [...params, limit, offset];
        const result = await pool.query(query, queryParams);

        const transformedData = result.rows.map(record => {
            try {
                const content = record.content || {};
                
                // Helper function to determine response status
                const getResponseStatus = (content: any) => {
                    switch (content.type) {
                        case 'skipped':
                            return ResponseStatus.SKIPPED;
                        case 'rejected':
                            return ResponseStatus.REJECTED;
                        case 'approved':
                            return ResponseStatus.APPROVED;
                        case 'posted':
                            return ResponseStatus.POSTED;
                        default:
                            return null;
                    }
                };

                return {
                    id: record.id,
                    tweet_id: content.tweet?.id || null,
                    cid: record.cid,
                    created_at: record.created_at,
                    author_username: content.tweet?.author_username || null,
                    tweet_content: content.tweet?.text || null,
                    thread: content.tweet?.thread || null,
                    response_content: ['rejected', 'approved', 'skipped', 'posted'].includes(content.type) 
                        ? content.response || null 
                        : null,
                    result_type: content.type || 'unknown',
                    skip_reason: content.type === 'skipped' 
                        ? content.workflowState?.decision?.reason || null 
                        : null,
                    response_status: getResponseStatus(content),
                    auto_feedback: content.workflowState?.autoFeedback || null 
                };
            } catch (error) {
                console.error('Error transforming record:', error, 'Record:', record);
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
                    response_status: null,
                    auto_feedback: null
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
        console.error('Error in getAllDsn:', error);
        throw error;
    }
}