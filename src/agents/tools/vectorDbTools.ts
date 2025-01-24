import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { VectorDB } from '../../services/vectorDb/VectorDB.js';

const logger = createLogger('vector-db-tool');

const extractTextFromJson = (obj: any): string => {
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(item => extractTextFromJson(item)).join(' ');
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj)
      .map(value => extractTextFromJson(value))
      .join(' ');
  }
  return '';
};

export const createVectorDbInsertTool = (vectorDb: VectorDB) =>
  new DynamicStructuredTool({
    name: 'vector_db_insert',
    description: 'Search the vector database',
    schema: z.object({ data: z.string() }),
    func: async ({ data }: { data: string }) => {
      try {
        logger.info('Inserting data into vector db', { data });
        const parsed = JSON.parse(data);
        const textToEmbed = extractTextFromJson(parsed);
        logger.info('Extracted text for embedding', { textToEmbed });
        const memories = await vectorDb.insert(textToEmbed);
        return memories;
      } catch (error) {
        logger.error('Error in vectorDbTool:', error);
        return [];
      }
    },
  });

export const invokeVectorDbInsertTool = async (toolNode: ToolNode, { data }: { data: string }) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'vector_db_insert',
            args: { data },
            id: 'vector_db_insert_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};

export const createVectorDbSearchTool = (vectorDb: VectorDB) =>
  new DynamicStructuredTool({
    name: 'vector_db_search',
    description: 'Search the vector database',
    schema: z.object({ query: z.string(), limit: z.number().optional() }),
    func: async ({ query, limit }: { query: string; limit?: number }) => {
      const memories = await vectorDb.search(query, limit);
      logger.info('Searched vector db', { query, memories });
      return memories;
    },
  });

export const invokeVectorDbSearchTool = async (
  toolNode: ToolNode,
  { query, limit }: { query: string; limit?: number },
) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'vector_db_search',
            args: { query, limit },
            id: 'vector_db_search_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
