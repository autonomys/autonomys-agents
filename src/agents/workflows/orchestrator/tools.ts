import { createTwitterWorkflowTool } from './workflowTools/twitterWorkflowTool.js';
import {
  createFetchMentionsTool,
  createFetchMyRecentRepliesTool,
  createFetchMyRecentTweetsTool,
  createFetchTimelineTool,
  createPostTweetTool,
} from '../../tools/twitterTools.js';
import { createVectorDbInsertTool, createVectorDbSearchTool } from '../../tools/vectorDbTools.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createSaveExperienceTool } from '../../tools/saveExperienceTool.js';

export const createTools = (twitterApi: TwitterApi, vectorDb: VectorDB) => {
  const twitterWorkflowTool = createTwitterWorkflowTool();
  const fetchMentionsTool = createFetchMentionsTool(twitterApi);
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi);
  const fetchMyRecentRepliesTool = createFetchMyRecentRepliesTool(twitterApi);
  const fetchMyRecentTweetsTool = createFetchMyRecentTweetsTool(twitterApi);
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);
  const vectorDbInsertTool = createVectorDbInsertTool(vectorDb);
  const saveExperienceTool = createSaveExperienceTool();

  return {
    twitterWorkflowTool,
    fetchMentionsTool,
    fetchTimelineTool,
    postTweetTool,
    fetchMyRecentRepliesTool,
    fetchMyRecentTweetsTool,
    vectorDbSearchTool,
    vectorDbInsertTool,
    saveExperienceTool,
    tools: [
      twitterWorkflowTool,
      fetchMentionsTool,
      fetchTimelineTool,
      postTweetTool,
      fetchMyRecentRepliesTool,
      fetchMyRecentTweetsTool,
      vectorDbSearchTool,
      vectorDbInsertTool,
      saveExperienceTool,
    ],
  };
};
