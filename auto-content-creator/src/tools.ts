import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import fetch from 'node-fetch';

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
      num: '3',
    });

    const url = `https://serpapi.com/search?${params.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const results = data.organic_results || [];

      if (!results.length) {
        return 'No results found.';
      }

      const snippets = results
        .map((result: any) => {
          return `${result.title}\n${result.snippet}\n${result.link}`;
        })
        .join('\n\n');

      return snippets;
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
