import { TwitterAPI } from '../../../services/twitter/client.js';
import { createFetchMentionsTool } from '../../tools/fetchMentionsTool.js';
import { createFetchTimelineTool } from '../../tools/fetchTimelineTool.js';

export const createTools = (twitterAPI: TwitterAPI) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterAPI);
  const fetchMentionsTool = createFetchMentionsTool(twitterAPI);

  return {
    fetchTimelineTool,
    fetchMentionsTool,
    tools: [fetchTimelineTool, fetchMentionsTool],
  };
};
