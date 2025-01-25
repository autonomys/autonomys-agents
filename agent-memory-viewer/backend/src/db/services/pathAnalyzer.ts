import { pool } from '../postgres/connection.js';
import { openai } from '../../utils/llm/openai.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('path-analyzer');

async function discoverNewPaths(): Promise<string[]> {
  try {
    const sampleResult = await pool.query(
      'SELECT content FROM memory_records WHERE content IS NOT NULL ORDER BY RANDOM() LIMIT 30',
    );

    if (sampleResult.rows.length === 0) {
      logger.warn('No sample data found for path analysis');
      return [];
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Return only PostgreSQL JSONB path expressions that could contain searchable text. One per line.',
        },
        {
          role: 'system',
          content: `You are a PostgreSQL JSONB expert. Analyze the provided JSON structures and return ONLY valid PostgreSQL JSONB path expressions that could contain searchable text.
            Rules:
            - Each path must start with 'content'
            - One path per line
            - No explanations, just paths
            - Include paths for text content, messages, titles, descriptions, usernames, and author information
            - Skip paths that would point to arrays or complex nested objects`,
        },
        {
          role: 'user',
          content: `Given this JSON: ${JSON.stringify(
            sampleResult.rows.map(r => r.content),
            null,
            2,
          )}, list paths where text and username/author content might be found. Skip the thread inside the tweets.`,
        },
      ],
      temperature: 0.1,
    });

    return (
      completion.choices[0]?.message?.content
        ?.split('\n')
        .filter(path => path.startsWith('content') && path.includes('->>')) || []
    );
  } catch (error) {
    logger.error('Error discovering paths:', error);
    return [];
  }
}

export async function analyzePaths(searchText: string): Promise<string[]> {
  try {
    const result = await pool.query(`
      SELECT path 
      FROM path_cache 
      ORDER BY hits DESC
    `);

    console.log('Paths from database:', result.rows);

    // Only use paths that end with ->>, which return text values
    const paths = result.rows.map(row => row.path).filter(path => path.includes('->>'));

    // Occasionally discover new paths
    if (Math.random() < 0.01) {
      const newPaths = await discoverNewPaths();
      for (const path of newPaths) {
        await pool.query(
          'INSERT INTO path_cache (path) VALUES ($1) ON CONFLICT (path) DO NOTHING',
          [path],
        );
      }
    }

    return paths;
  } catch (error) {
    logger.error('Error in analyzePaths:', error);
    return [];
  }
}

export async function recordSearchResults(pathResults: Map<string, boolean>): Promise<void> {
  try {
    for (const [path, wasSuccessful] of pathResults.entries()) {
      await pool.query(
        `
        UPDATE path_cache 
        SET 
          hits = hits + 1,
          success_count = success_count + $1,
          last_used = CURRENT_TIMESTAMP
        WHERE path = $2
      `,
        [wasSuccessful ? 1 : 0, path],
      );
    }
  } catch (error) {
    logger.error('Error recording results:', error);
  }
}
