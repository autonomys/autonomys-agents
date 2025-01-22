import { createTwitterWorkflowTool } from './workflowTools/twitterWorkflowTool.js';
import { createFetchMentionsTool } from '../../tools/twitter/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/twitter/fetchTimelineTool.js';
import { createPostTweetTool } from '../../tools/twitter/postTweetTool.js';
import { TwitterApi } from '../../../services/twitter/types.js';

export const createTools = (twitterApi: TwitterApi) => {
  const twitterWorkflowTool = createTwitterWorkflowTool();
  const fetchMentionsTool = createFetchMentionsTool(twitterApi);
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi);

  return {
    twitterWorkflowTool,
    fetchMentionsTool,
    fetchTimelineTool,
    postTweetTool,
    tools: [twitterWorkflowTool, fetchMentionsTool, fetchTimelineTool, postTweetTool],
  };
};
