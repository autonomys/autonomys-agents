import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('vector-db-tool');

export const createExperienceVectorDbSearchTool = (
  searchVectorDb: (params: {
    query: string;
    metadataFilter?: string;
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
      - Use the time filter to narrow results to a specific period, not the query field.

      USAGE GUIDANCE:
      - Use this when you need to recall specific past conversations or actions
      - Consider searching with multiple queries if your first search returns no results
      - Time filters help narrow results to relevant periods`,
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
      metadataFilter: z.string().describe(
        `Filter the search by metadata. Metadata filter examples: 
            - based on range: created_at >= datetime('now', '-1 hour')
            - before time: created_at <= "2025-02-12 09:00:00"' +
            - after time: created_at >= "2025-02-11 14:30:00"`,
      ),
      limit: z.number().optional().default(6).describe('OPTIONAL: Limit the number of results returned'),
    }),
    func: async ({
      query,
      metadataFilter,
      limit,
    }: {
      query: string;
      metadataFilter?: string;
      limit?: number;
    }) => {
      const memories = await searchVectorDb({ query, metadataFilter, limit });
      logger.info('Searched vector db', { query, metadataFilter, memories });
      return memories;
    },
  });
