import { pool } from '../postgres/connection.js';
import { MemoryRecord, PaginationResult } from '../types/models.js';
import { broadcastNewMemory } from '../../websocket.js';
import { ResponseStatus } from '../../types/enums.js';
import { analyzePaths } from '../services/pathAnalyzer.js';

export async function saveMemoryRecord(
  cid: string,
  content: any,
  previous_cid: string,
  agent_name: string,
): Promise<MemoryRecord> {
  try {
    const result = await pool.query(
      'INSERT INTO memory_records (cid, content, previous_cid, agent_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [cid, JSON.stringify(content), previous_cid, agent_name],
    );
    broadcastNewMemory(result.rows[0]);
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      const existingRecord = await pool.query('SELECT * FROM memory_records WHERE cid = $1', [cid]);
      return existingRecord.rows[0];
    }
    throw error;
  }
}

export async function getMemoryByCid(cid: string): Promise<MemoryRecord | null> {
  const result = await pool.query('SELECT * FROM memory_records WHERE cid = $1', [cid]);
  return result.rows[0] || null;
}


export async function getAllDsn(
  page: number,
  limit: number,
  type?: ResponseStatus,
  searchText?: string,
  authorUsername?: string,
  agent?: string,
): Promise<PaginationResult<MemoryRecord>> {
  const offset = (page - 1) * limit;

  try {
    let countQuery = 'SELECT COUNT(*) FROM memory_records';
    let params: any[] = [];
    let conditions: string[] = [];

    if (type) {
      if (type === ResponseStatus.APPROVED) {
        conditions.push(`(content->>'type' = 'approved' OR content->>'type' = 'response')`);
      } else {
        conditions.push(`content->>'type' = $${params.length + 1}`);
        params.push(type);
      }
    }

    if (agent && agent !== 'all') {
      conditions.push(`agent_name = $${params.length + 1}`);
      params.push(agent);
    }

    if (searchText) {
      const searchPaths = await analyzePaths(searchText);
      const pathConditions = searchPaths.map(path => `${path} ILIKE $${params.length + 1}`);

      conditions.push(`(${pathConditions.join(' OR ')})`);
      params.push(`%${searchText}%`);
    }

    if (authorUsername) {
      const usernamePaths = await analyzePaths(authorUsername);
      const usernameConditions = usernamePaths.map(path => `${path} ILIKE $${params.length + 1}`);

      conditions.push(`(${usernameConditions.join(' OR ')})`);
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
                mr.content,
                mr.created_at,
                mr.agent_name,
                content->>'timestamp' as timestamp
            FROM memory_records mr`;

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY (content->>'timestamp')::timestamp DESC NULLS LAST
                  LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const queryParams = [...params, limit, offset];
    const result = await pool.query(query, queryParams);

    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getAllDsn:', error);
    throw error;
  }
}
