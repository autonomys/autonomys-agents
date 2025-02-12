import '@mendable/firecrawl-js';
import { FireCrawlLoader } from '@langchain/community/document_loaders/web/firecrawl';
import { DynamicStructuredTool } from 'langchain/tools';
import { z } from 'zod';
const loader = (url: string) =>
  new FireCrawlLoader({
    url: 'https://firecrawl.dev', // The URL to scrape
    apiKey: process.env.FIRECRAWL_API_KEY, // Optional, defaults to `FIRECRAWL_API_KEY` in your env.
    mode: 'scrape', // The mode to run the crawler in. Can be "scrape" for single urls or "crawl" for all accessible subpages
    params: {
      // optional parameters based on Firecrawl API docs
      // For API documentation, visit https://docs.firecrawl.dev
    },
  });

export const createWebCrawlTool = () =>
  new DynamicStructuredTool({
    name: 'web_crawl',
    description: 'Crawl a website and return the content.',
    schema: z.object({
      url: z.string().describe('The URL to crawl.'),
    }),
    func: async ({ url }: { url: string }) => loader(url),
  });
