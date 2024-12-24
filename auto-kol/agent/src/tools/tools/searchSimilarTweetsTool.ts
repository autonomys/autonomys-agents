import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { ChromaService } from '../../services/vectorstore/chroma.js';

const logger = createLogger('search-similar-tweets-tool');

export const createSearchSimilarTweetsTool = () =>
  new DynamicStructuredTool({
    name: 'search_similar_tweets',
    description: 'Search for similar tweets in the vector store',
    schema: z.object({
      query: z.string(),
      k: z.number().optional().default(5),
    }),
    func: async ({ query, k }) => {
      try {
        const chromaService = await ChromaService.getInstance();
        const results = await chromaService.searchSimilarTweetsWithScore(query, k);
        return {
          similar_tweets: results.map(([doc, score]) => ({
            text: doc.pageContent,
            metadata: doc.metadata,
            similarity_score: score,
          })),
        };
      } catch (error) {
        logger.error('Error searching similar tweets:', error);
        return { similar_tweets: [] };
      }
    },
  });
