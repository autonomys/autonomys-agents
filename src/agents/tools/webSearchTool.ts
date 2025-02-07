import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { createLogger } from '../../utils/logger.js';
import axios from 'axios';
import { load } from 'cheerio';
import { config } from '../../config/index.js';

const logger = createLogger('web-search-tool');

export const createWebSearchTool = () =>
  new DynamicStructuredTool({
    name: 'web_search',
    description: 'Perform a web search for up-to-date information or to do research on a topic.',
    schema: z.object({
      query: z.string().describe('The search query string.'),
      num: z.string().describe('The number of results to return.'),
    }),
    func: async ({ query, num }: { query: string; num: string }) => {
      const API_KEY = config.SERPAPI_API_KEY;
      if (!API_KEY) {
        logger.error('SERPAPI_API_KEY is not set.');
        return 'Error: SERPAPI_API_KEY is not set.';
      }
      logger.info('Performing web search for query:', { query });
      const params = new URLSearchParams({
        api_key: API_KEY,
        engine: 'google',
        q: query,
        num,
      });

      const url = `https://serpapi.com/search?${params.toString()}`;

      try {
        const response = await axios.get(url);
        const data = response.data;
        const results = data.organic_results || [];

        if (!results.length) {
          logger.warn('No results found for the search query');
          return 'No results found.';
        }

        logger.info(`Found ${results.length} search results. Processing...`);
        const detailedResults = await Promise.all(
          results.map(async (result: any, index: number) => {
            logger.info(`Processing result ${index + 1} of ${results.length}`);
            try {
              logger.info(`Fetching full content for ${result.link}`);
              const pageResponse = await axios.get(result.link, { timeout: 10000 });
              const $ = load(pageResponse.data);
              $('script, style').remove();
              const fullContent = $('body').text().replace(/\s+/g, ' ').trim();
              logger.info(`Successfully fetched and processed content for result ${index + 1}`);
              return {
                title: result.title,
                snippet: result.snippet,
                link: result.link,
                fullContent: fullContent.substring(0, 1000), // Limiting to first 1000 characters
              };
            } catch (error: any) {
              logger.error(`Error processing result ${index + 1}: ${error.message}`);
              return {
                title: result.title,
                snippet: result.snippet,
                link: result.link,
                fullContent: 'Error fetching content',
              };
            }
          }),
        );

        logger.info(`Web search completed. Processed ${detailedResults.length} results.`);
        return JSON.stringify(detailedResults, null, 2);
      } catch (error: any) {
        logger.error(`Error performing web search: ${error.message}`);
        return 'Error performing web search.';
      }
    },
  });
