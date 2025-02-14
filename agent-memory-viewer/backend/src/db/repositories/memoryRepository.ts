import { pool } from '../postgres/connection.js';
import { MemoryRecord, PaginationResult } from '../types/models.js';
import { broadcastNewMemory } from '../../websocket.js';
import { analyzePaths, recordSearchResults } from '../services/pathAnalyzer.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('memoryRepository');

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
  searchText?: string,
  authorUsername?: string,
  agent?: string,
): Promise<PaginationResult<MemoryRecord>> {
  const offset = (page - 1) * limit;

  try {
    let countQuery = 'SELECT COUNT(*) FROM memory_records';
    let params: any[] = [];
    let conditions: string[] = [];

    if (agent && agent !== 'all') {
      conditions.push(`agent_name = $${params.length + 1}`);
      params.push(agent);
    }

    if (searchText) {
      const searchPaths = await analyzePaths(searchText);
      const pathResults = new Map<string, boolean>();

      params.push(`%${searchText}%`);

      const pathConditions = searchPaths.map(path => `${path} ILIKE $${params.length}`);

      if (pathConditions.length > 0) {
        conditions.push(`(${pathConditions.join(' OR ')})`);
      }

      const pathMatchQuery = searchPaths
        .map(path => `COUNT(CASE WHEN ${path} ILIKE $1 THEN 1 END) > 0 as "${path}"`)
        .join(', ');

      if (pathMatchQuery) {
        const matchResults = await pool.query(
          `SELECT ${pathMatchQuery} FROM memory_records WHERE content IS NOT NULL`,
          [`%${searchText}%`],
        );

        searchPaths.forEach(path => {
          pathResults.set(path, matchResults.rows[0][path]);
        });

        recordSearchResults(pathResults).catch(error =>
          logger.error('Error recording search results:', error),
        );
      }
    }

    if (authorUsername) {
      const authorPaths = await analyzePaths(authorUsername);
      params.push(`%${authorUsername}%`);

      const authorConditions = authorPaths
        .filter(path => path.endsWith("->>'username'") || path.endsWith("->>'author'"))
        .map(path => `${path} ILIKE $${params.length}`);

      if (authorConditions.length > 0) {
        conditions.push(`(${authorConditions.join(' OR ')})`);
      }
    }

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    let query = `
        SELECT 
          id,
          cid,
          content,
          created_at,
          agent_name,
          content->>'timestamp' as timestamp
        FROM memory_records
    `;
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY (content->>'timestamp')::timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

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
    logger.error('Error in getAllDsn:', error);
    throw error;
  }
}
