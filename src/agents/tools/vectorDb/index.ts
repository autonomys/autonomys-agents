import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

const logger = createLogger('vector-db-tool');

export const createVectorDbInsertTool = (vectorDb: VectorDB) =>
  new DynamicStructuredTool({
    name: 'vector_db_insert',
    description: `
    Save SHORT and MEDIUM-TERM, CONTEXTUAL data to the vector database for future recall.  
    USE THIS WHEN:  
    - Starting/updating a task (e.g., "User asked me to draft a tweet about X").  
    - Needing to remember recent chats or actions (e.g., "User prefers tea over coffee").  
    FORMAT: Include timestamps, keywords, and action summaries.  `,
    schema: z.object({ data: z.string() }),
    func: async ({ data }: { data: string }) => {
      try {
        logger.info('Inserting data into vector db', { data });

        const memories = await vectorDb.insert(data);
        return memories;
      } catch (error) {
        logger.error('Error in vectorDbTool:', error);
        return [];
      }
    },
  });

export const createVectorDbSearchTool = (vectorDb: VectorDB) =>
  new DynamicStructuredTool({
    name: 'vector_db_search',
    description: `
    Search the vector database for RECENT, CONTEXTUAL data to answer questions or continue workflows.  
    USE THIS WHEN:  
    - The user references past 3 days (e.g., "What did I ask you to do yesterday?").  
    - You need to resume a task (e.g., "Continue drafting the tweet about X").  
    - The query is vague (e.g., "Explain this again" -> search chat history).  
    OUTPUT: Return timestamps and matched keywords.`,
    schema: z.object({
      query: z.string().describe(
        `Query text to find semantically similar content. The query will be embedded and compared using HNSW similarity:
          - Focus on key concepts rather than exact phrases' +
          - Include relevant context terms`,
      ),
      metadataFilter: z.string().describe(
        `Filter the search by metadata. Metadata filter examples: 
          - based on range: created_at >= datetime('now', '-1 hour')
          - before time: created_at <= "2025-02-12 09:00:00"' +
          - after time: created_at >= "2025-02-11 14:30:00"`,
      ),
      limit: z.number().optional(),
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
      const memories = !metadataFilter
        ? await vectorDb.search(query, limit)
        : await vectorDb.searchWithMetadata(query, metadataFilter, limit);
      logger.info('Searched vector db', { query, metadataFilter, memories });
      return memories;
    },
  });

export const createExperienceVectorDbSearchTool = (vectorDb: VectorDB) =>
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
      limit: z.number().optional(),
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
      const memories = !metadataFilter
        ? await vectorDb.search(query, limit)
        : await vectorDb.searchWithMetadata(query, metadataFilter, limit);
      logger.info('Searched vector db', { query, metadataFilter, memories });
      return memories;
    },
  });
