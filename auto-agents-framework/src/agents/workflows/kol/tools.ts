import { TwitterApi } from '../../../services/twitter/client.js';
import { createFetchMentionsTool } from '../../tools/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/fetchTimelineTool.js';
import { createPostTweetTool } from '../../tools/postTweetTool.js';
import { createUploadToDsnTool } from '../../tools/uploadToDsnTool.js';
export const createTools = (twitterApi: TwitterApi) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const fetchMentionsTool = createFetchMentionsTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi);
  const uploadToDsnTool = createUploadToDsnTool();

  return {
    fetchTimelineTool,
    fetchMentionsTool,
    postTweetTool,
    uploadToDsnTool,
    tools: [fetchTimelineTool, fetchMentionsTool, postTweetTool, uploadToDsnTool],
  };
};
