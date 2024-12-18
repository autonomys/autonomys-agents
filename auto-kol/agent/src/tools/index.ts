import { createFetchTimelineTool } from './tools/fetchTimelineTool.js';
import { createTweetSearchTool } from './tools/tweetSearchTool.js';
import { createQueueResponseTool } from './tools/queueResponseTool.js';
import { createQueueSkippedTool } from './tools/queueSkippedTool.js';
import { createSearchSimilarTweetsTool } from './tools/searchSimilarTweetsTool.js';
import { createMentionTool } from './tools/mentionTool.js';
import { ExtendedScraper } from '../services/twitter/api.js';

export const createTools = (scraper: ExtendedScraper) => {

    const mentionTool = createMentionTool(scraper);

    const fetchTimelineTool = createFetchTimelineTool();

    const tweetSearchTool = createTweetSearchTool(scraper);

    const queueResponseTool = createQueueResponseTool();

    const queueSkippedTool = createQueueSkippedTool();

    const searchSimilarTweetsTool = createSearchSimilarTweetsTool();

    return {
        mentionTool,
        tweetSearchTool,
        queueResponseTool,
        queueSkippedTool,
        searchSimilarTweetsTool,
        fetchTimelineTool,
        tools: [
            mentionTool,
            tweetSearchTool,
            queueResponseTool,
            queueSkippedTool,
            searchSimilarTweetsTool,
            fetchTimelineTool,
        ]
    };
};