import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

const logger = createLogger('vector-db-tool');

export const createExperienceVectorDbSearchTool = (
  searchVectorDb: (params: {
    query: string;
    sqlFilter?: string;
    limit?: number;
  }) => Promise<Array<{ rowid: number; distance: number; content: string; created_at: string }>>,
) =>
  new DynamicStructuredTool({
    name: 'experience_vector_db_search',
    description: `
      Search your memory database for past experiences and interactions. 
      This tool helps you recall context from your previous activities to enhance your responses.
      
      EFFECTIVE QUERIES:
      - Use specific, content-rich phrases (not generic terms like "conversations" or "interactions")
      - Include distinctive keywords that might appear in stored memories
      - Focus on specific topics, entities, or actions 
      - Use the SQL filter to narrow results to a specific period, not the query field.

      USAGE GUIDANCE:
      - Use this when you need to recall specific past conversations or actions
      - Consider searching with multiple queries if your first search returns no results
      - SQL filters help narrow results to relevant periods`,
    schema: z.object({
      query: z.string().describe(
        `Specific, detailed query to find semantically similar content. For effective results:
        - Include specific keywords likely to appear in stored memories
        - Use descriptive phrases rather than general terms
        - Do not use timeframes in the query (recent, old, etc.)
        - Target particular topics, actions, or content types
        - Bad example: "recent conversations"
        - Good example: "explanations about blockchain to users" or "responses to elon musk tweets"`,
      ),
      sqlFilter: z.string().describe(
        `SQL WHERE clause to filter search results. Examples for date/time filtering: 
            - Recent items: created_at >= datetime('now', '-1 hour')
            - Before specific date: created_at <= '2025-02-12 09:00:00'
            - After specific date: created_at >= '2025-02-11 14:30:00'
            - Date range: created_at >= '2025-02-11' AND created_at < '2025-02-12'
            - Today only: date(created_at) = date('now')
            
            Note: The created_at field is stored as DATETIME in SQLite, so you can use all SQLite's 
            date/time functions like datetime(), date(), time(), strftime(), etc.
            
            You can also filter on content: content LIKE '%keyword%'`,
      ),
      limit: z
        .number()
        .optional()
        .default(6)
        .describe('OPTIONAL: Limit the number of results returned'),
    }),
    func: async ({
      query,
      sqlFilter,
      limit,
    }: {
      query: string;
      sqlFilter?: string;
      limit?: number;
    }) => {
      const memories = await searchVectorDb({ query, sqlFilter, limit });
      logger.info('Searched vector db', { query, sqlFilter, memories });
      return memories;
    },
  });

export const createExperienceVectorDbQueryContentTool = (
  queryContent: (
    sqlQuery: string,
  ) => Promise<Array<{ rowid: number; content: string; created_at: string }>>,
) =>
  new DynamicStructuredTool({
    name: 'experience_vector_db_query_content',
    description: `
      Search your memory database for past experiences and interactions using SQL queries.

      The Schema of the database table (content_store) is as follows:
        - rowid: INTEGER PRIMARY KEY AUTOINCREMENT
        - content: TEXT
        - created_at: DATETIME
      
      USE THIS TOOL WHEN:
        - You want to query the content of the experiences database but don't need to do semantic search.
      
      EXAMPLES USE CASES:
        - Find the last 10 experiences
        - Find all experiences in the last hour
        - Find experiences with a specific CID

      SECURITY NOTES:
        - Only SELECT queries against the content_store table are allowed
        - Queries are validated to prevent dangerous operations
        - Queries must include the content_store table
      `,
    schema: z.object({
      sqlQuery: z.string().describe(`
        SQL query to execute. Must be a SELECT query targeting the content_store table.
        
        Common patterns:
        - Filtering by date: WHERE created_at >= datetime('now', '-1 hour')
        - Filtering by content: WHERE content LIKE '%keyword%'
        - Limiting results: LIMIT 10
        - Sorting: ORDER BY created_at DESC
        - Date functions: date(created_at) = date('now')
        
        Note: For security, only SELECT queries against the content_store table are allowed.
        Dangerous operations (DELETE, UPDATE, INSERT, etc.) will be rejected.
      `),
    }),
    func: async ({ sqlQuery }: { sqlQuery: string }) => {
      try {
        const memories = await queryContent(sqlQuery);
        logger.info('Queried vector db with SQL query', {
          sqlQuery,
          resultCount: memories.length,
        });
        return memories;
      } catch (error: any) {
        logger.error('SQL query rejected', {
          sqlQuery,
          error: error.message,
        });
      }
    },
  });

export const createVectorDbTools = (vectorDb: VectorDB) => {
  const search = (params: { query: string; sqlFilter?: string; limit?: number }) =>
    vectorDb.search(params);
  const queryContent = (sqlQuery: string) => vectorDb.queryContent(sqlQuery);

  return [
    createExperienceVectorDbSearchTool(search),
    createExperienceVectorDbQueryContentTool(queryContent),
  ];
};
