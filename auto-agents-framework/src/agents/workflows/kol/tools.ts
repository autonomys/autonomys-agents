import { TwitterAPI } from '../../../services/twitter/client.js';
import { createFetchMentionsTool } from '../../tools/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/fetchTimelineTool.js';
import { createPostTweetTool } from '../../tools/postTweetTool.js';

export const createTools = (twitterAPI: TwitterAPI) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterAPI);
  const fetchMentionsTool = createFetchMentionsTool(twitterAPI);
  const postTweetTool = createPostTweetTool(twitterAPI);
  return {
    fetchTimelineTool,
    fetchMentionsTool,
    postTweetTool,
    tools: [fetchTimelineTool, fetchMentionsTool, postTweetTool],
  };
};
