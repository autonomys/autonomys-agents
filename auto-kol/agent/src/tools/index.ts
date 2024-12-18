import { createFetchTimelineTool } from './tools/fetchTimelineTool.js';
import { createTweetSearchTool } from './tools/tweetSearchTool.js';
import { createQueueResponseTool } from './tools/queueResponseTool.js';
import { createQueueSkippedTool } from './tools/queueSkippedTool.js';
import { createSearchSimilarTweetsTool } from './tools/searchSimilarTweetsTool.js';
import { createMentionTool } from './tools/mentionTool.js';
import type { TwitterService } from '../services/twitter/twitterService.js';

export const createTools = (twitterService: TwitterService) => {

    const mentionTool = createMentionTool(twitterService);

    const fetchTimelineTool = createFetchTimelineTool(twitterService);

    const tweetSearchTool = createTweetSearchTool();

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