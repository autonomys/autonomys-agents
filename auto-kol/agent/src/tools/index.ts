import { createFetchTimelineTool } from './tools/fetchTimelineTool.js';
import { createTweetSearchTool } from './tools/tweetSearchTool.js';
import { createQueueResponseTool } from './tools/queueResponseTool.js';
import { createQueueSkippedTool } from './tools/queueSkippedTool.js';
import { createSearchSimilarTweetsTool } from './tools/searchSimilarTweetsTool.js';
import { createDsnUploadTool } from './tools/dsnUploadTool.js';

export const createTools = (scraper: any) => {

    const fetchTimelineTool = createFetchTimelineTool();

    const tweetSearchTool = createTweetSearchTool(scraper);

    const queueResponseTool = createQueueResponseTool();

    const queueSkippedTool = createQueueSkippedTool();

    const searchSimilarTweetsTool = createSearchSimilarTweetsTool();

    const dsnUploadTool = createDsnUploadTool();

    return {
        tweetSearchTool,
        queueResponseTool,
        queueSkippedTool,
        searchSimilarTweetsTool,
        fetchTimelineTool,
        dsnUploadTool,
        tools: [
            tweetSearchTool,
            queueResponseTool,
            queueSkippedTool,
            searchSimilarTweetsTool,
            fetchTimelineTool,
            dsnUploadTool
        ]
    };
};