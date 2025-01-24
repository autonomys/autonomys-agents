import { TwitterApi } from '../../../services/twitter/types.js';
import { createFetchMentionsTool } from '../../tools/twitter/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/twitter/fetchTimelineTool.js';
import { createPostTweetTool } from '../../tools/twitter/postTweetTool.js';
import { createUploadToDsnTool } from '../../tools/uploadToDsnTool.js';
import { createFetchMyRecentTweetsTool } from '../../tools/twitter/fetchMyRecentTweetsTool.js';
import { createFetchMyRecentRepliesTool } from '../../tools/twitter/fetchMyRecentRepliesTool.js';
import { createVectorDbInsertTool, createVectorDbSearchTool } from '../../tools/vectorDbTools.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

export const createTools = (twitterApi: TwitterApi, twitterVectorDb: VectorDB) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const fetchMentionsTool = createFetchMentionsTool(twitterApi);
  const fetchMyRecentTweetsTool = createFetchMyRecentTweetsTool(twitterApi);
  const fetchMyRecentRepliesTool = createFetchMyRecentRepliesTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi);
  const twitterVectorDbInsertTool = createVectorDbInsertTool(twitterVectorDb);
  const twitterVectorDbSearchTool = createVectorDbSearchTool(twitterVectorDb);
  const uploadToDsnTool = createUploadToDsnTool();

  return {
    fetchTimelineTool,
    fetchMentionsTool,
    fetchMyRecentTweetsTool,
    fetchMyRecentRepliesTool,
    postTweetTool,
    twitterVectorDbInsertTool,
    twitterVectorDbSearchTool,
    uploadToDsnTool,
    tools: [
      fetchTimelineTool,
      fetchMentionsTool,
      fetchMyRecentTweetsTool,
      fetchMyRecentRepliesTool,
      postTweetTool,
      twitterVectorDbInsertTool,
      twitterVectorDbSearchTool,
      uploadToDsnTool,
    ],
  };
};
