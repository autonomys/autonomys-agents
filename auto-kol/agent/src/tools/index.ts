import { createFetchTimelineTool } from './tools/fetchTimelineTool.js';
import { createTweetSearchTool } from './tools/tweetSearchTool.js';
import { createQueueResponseTool } from './tools/queueResponseTool.js';
import { createQueueSkippedTool } from './tools/queueSkippedTool.js';
import { createSearchSimilarTweetsTool } from './tools/searchSimilarTweetsTool.js';
import { createWebSearchTool } from './tools/webSearchTool.js';

export const createTools = (scraper: any) => {

    const fetchTimelineTool = createFetchTimelineTool();

    const tweetSearchTool = createTweetSearchTool(scraper);

    const queueResponseTool = createQueueResponseTool();

    const queueSkippedTool = createQueueSkippedTool();

    const searchSimilarTweetsTool = createSearchSimilarTweetsTool();

    const webSearchTool = createWebSearchTool();

    return {
        tweetSearchTool,
        queueResponseTool,
        queueSkippedTool,
        searchSimilarTweetsTool,
        fetchTimelineTool,
        webSearchTool,
        tools: [tweetSearchTool, queueResponseTool, queueSkippedTool, searchSimilarTweetsTool, fetchTimelineTool, webSearchTool]
    };
};