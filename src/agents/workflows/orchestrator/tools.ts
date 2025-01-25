import { createTwitterWorkflowTool } from './workflowTools/twitterWorkflowTool.js';
import { createFetchMentionsTool } from '../../tools/twitter/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/twitter/fetchTimelineTool.js';
import { createPostTweetTool } from '../../tools/twitter/postTweetTool.js';
import { createFetchMyRecentRepliesTool } from '../../tools/twitter/fetchMyRecentRepliesTool.js';
import { createFetchMyRecentTweetsTool } from '../../tools/twitter/fetchMyRecentTweetsTool.js';
import { createVectorDbSearchTool, createVectorDbInsertTool } from '../../tools/vectorDbTools.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

export const createTools = (twitterApi: TwitterApi, vectorDb: VectorDB) => {
  const twitterWorkflowTool = createTwitterWorkflowTool();
  const fetchMentionsTool = createFetchMentionsTool(twitterApi);
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi);
  const fetchMyRecentRepliesTool = createFetchMyRecentRepliesTool(twitterApi);
  const fetchMyRecentTweetsTool = createFetchMyRecentTweetsTool(twitterApi);
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);
  const vectorDbInsertTool = createVectorDbInsertTool(vectorDb);

  return {
    twitterWorkflowTool,
    fetchMentionsTool,
    fetchTimelineTool,
    postTweetTool,
    fetchMyRecentRepliesTool,
    fetchMyRecentTweetsTool,
    vectorDbSearchTool,
    vectorDbInsertTool,
    tools: [
      twitterWorkflowTool,
      fetchMentionsTool,
      fetchTimelineTool,
      postTweetTool,
      fetchMyRecentRepliesTool,
      fetchMyRecentTweetsTool,
      vectorDbSearchTool,
      vectorDbInsertTool,
    ],
  };
};
