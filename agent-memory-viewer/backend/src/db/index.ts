/* eslint-disable */

import pkg from 'pg';
const { Pool } = pkg;

import { config } from '../config/index.js';
import { broadcastNewMemory } from '../websocket.js';
import { ResponseStatus } from '../types/enums.js';
import { openai } from '../services/openai.js';

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
  database: 'agent_memory',
});

export interface MemoryRecord {
  id: number;
  cid: string;
  content: any;
  created_at: Date;
}

export async function saveMemoryRecord(
  cid: string,
  content: any,
  previous_cid: string,
): Promise<MemoryRecord> {
  try {
    const result = await pool.query(
      'INSERT INTO memory_records (cid, content, previous_cid) VALUES ($1, $2, $3) RETURNING *',
      [cid, JSON.stringify(content), previous_cid],
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

// New function to analyze content structure using LLM
async function analyzePaths(searchText: string): Promise<string[]> {
  try {
    // Sample 20 random records instead of recent ones
    const sampleResult = await pool.query(
      'SELECT content FROM memory_records ORDER BY RANDOM() LIMIT 20'
    );
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            `You are a SQL expert. Return only PostgreSQL JSONB path expressions using the -> and ->> operators, one per line. 
            Example: content->'tweet'->>'text'
            or
            content->'author'->>'username'
            `
        },
        {
          role: 'user',
          content: `Given this JSON: ${JSON.stringify(
            sampleResult.rows.map(r => r.content),
            null,
            2,
          )}, list paths where text and username/author content might be found. Skip the thread inside the tweets.`
        }
      ],
      temperature: 0
    });
    
    const paths = completion.choices[0]?.message?.content?.split('\n').filter(Boolean) || [];
    console.log('LLM generated paths:', paths);

    return paths
      .map(path => path.trim())
      .filter(path => path.includes('->'))
      .map(path => {
        if (path.startsWith('content')) return path;
        const parts = path.split('->');
        return `content->'${parts[0]}'${parts[1]}`;
      })
      .filter(path => path.includes('->>'));
  } catch (error) {
    return [];
  }
}

export async function getAllDsn(
  page: number,
  limit: number,
  type?: ResponseStatus,
  searchText?: string,
  authorUsername?: string,
): Promise<any> {
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
