import { TwitterAPI } from '../../../services/twitter/client.js';
import { createFetchMentionsTool } from '../../tools/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/fetchTimelineTool.js';
import { createPostTweetTool } from '../../tools/postTweetTool.js';
import { createUploadToDSNTool } from '../../tools/uploadToDSNTool.js';
export const createTools = (twitterAPI: TwitterAPI) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterAPI);
  const fetchMentionsTool = createFetchMentionsTool(twitterAPI);
  const postTweetTool = createPostTweetTool(twitterAPI);
  const uploadToDSNTool = createUploadToDSNTool();

  return {
    fetchTimelineTool,
    fetchMentionsTool,
    postTweetTool,
    uploadToDSNTool,
    tools: [fetchTimelineTool, fetchMentionsTool, postTweetTool, uploadToDSNTool],
  };
};
