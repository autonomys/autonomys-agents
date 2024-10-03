import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { load } from 'cheerio';

export const webSearchTool = tool(
  async input => {
    const API_KEY = process.env.SERPAPI_API_KEY;
    if (!API_KEY) {
      console.error('SERPAPI_API_KEY is not set.');
      return 'Error: SERPAPI_API_KEY is not set.';
    }
    const query = input.query;
    const params = new URLSearchParams({
      api_key: API_KEY,
      engine: 'google',
      q: query,
      num: '5', // Increased from 3 to 5 results
    });

    const url = `https://serpapi.com/search?${params.toString()}`;

    try {
      const response = await axios.get(url);
      const data = response.data;
      const results = data.organic_results || [];

      if (!results.length) {
        return 'No results found.';
      }

      const detailedResults = await Promise.all(
        results.map(async (result: any) => {
          let fullContent = '';
          try {
            const pageResponse = await axios.get(result.link);
            const $ = load(pageResponse.data);
            fullContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000); // Get first 1000 characters
          } catch (error) {
            console.error(`Error fetching full content for ${result.link}:`, error);
          }

          return `
Title: ${result.title}
Snippet: ${result.snippet}
Link: ${result.link}
Full Content Preview: ${fullContent}
        `.trim();
        })
      );

      return detailedResults.join('\n\n');
    } catch (error) {
      console.error('Error performing web search:', error);
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
