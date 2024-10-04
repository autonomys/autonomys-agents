import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { load } from 'cheerio';
import logger from './logger';

export const webSearchTool = tool(
  async input => {
    const API_KEY = process.env.SERPAPI_API_KEY;
    if (!API_KEY) {
      logger.error('SERPAPI_API_KEY is not set.');
      return 'Error: SERPAPI_API_KEY is not set.';
    }
    const query = input.query;
    const params = new URLSearchParams({
      api_key: API_KEY,
      engine: 'google',
      q: query,
      num: '10',
    });

    const url = `https://serpapi.com/search?${params.toString()}`;

    try {
      logger.info(`Performing web search for query: ${query}`);
      const response = await axios.get(url);
      const data = response.data;
      const results = data.organic_results || [];

      if (!results.length) {
        logger.warn('No results found for the search query');
        return 'No results found.';
      }

      const detailedResults = await Promise.all(
        results.map(async (result: any) => {
          let fullContent = '';
          try {
            logger.info(`Fetching full content for ${result.link}`);
            const pageResponse = await axios.get(result.link, { timeout: 10000 });
            const $ = load(pageResponse.data);

            // Remove script and style elements
            $('script, style').remove();

            // Get text
            fullContent = $('body').text();

            // Clean up the text
            fullContent = fullContent
              .replace(/\s+/g, ' ')
              .trim()
              .split('\n')
              .map(line => line.trim())
              .filter(line => line)
              .join('\n');
          } catch (error) {
            logger.error(`Error fetching full content for ${result.link}:`, error);
          }

          return {
            title: result.title,
            snippet: result.snippet,
            link: result.link,
            fullContent,
          };
        })
      );

      logger.info(`Web search completed. Found ${detailedResults.length} results.`);
      return JSON.stringify(detailedResults, null, 2);
    } catch (error) {
      logger.error('Error performing web search:', error);
      return 'Error performing web search.';
    }
  },
  {
    name: 'web_search',
    description: 'Perform a web search for up-to-date information.',
    schema: z.object({
      query: z.string().describe('The search query string.'),
    }),
  }
);
