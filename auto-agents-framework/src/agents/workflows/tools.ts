import { TwitterAPI } from '../../services/twitter/client.js';
import { createFetchTimelineTool } from '../tools/fetchTimelineTool.js';

export const createTools = (twitterAPI: TwitterAPI) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterAPI);

  return {
    fetchTimelineTool,
    tools: [fetchTimelineTool],
  };
};
