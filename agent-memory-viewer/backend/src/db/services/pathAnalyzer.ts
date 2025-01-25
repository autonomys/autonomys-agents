import { openai } from '../../utils/llm/openai.js';
import { pool } from '../postgres/connection.js';

export async function analyzePaths(searchText: string): Promise<string[]> {
  try {
    const sampleResult = await pool.query(
      'SELECT content FROM memory_records ORDER BY RANDOM() LIMIT 20',
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a SQL expert. Return only PostgreSQL JSONB path expressions using the -> and ->> operators, one per line. 
            Example: content->'tweet'->>'text'
            or
            content->'author'->>'username'
            `,
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
      temperature: 0,
    });

    return (
      completion.choices[0]?.message?.content
        ?.split('\n')
        .filter(Boolean)
        .map(path => path.trim())
        .filter(path => path.includes('->'))
        .map(path => {
          if (path.startsWith('content')) return path;
          const parts = path.split('->');
          return `content->'${parts[0]}'${parts[1]}`;
        })
        .filter(path => path.includes('->>')) || []
    );
  } catch (error) {
    return [];
  }
}
