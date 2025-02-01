import { createAllTwitterTools } from '../../tools/twitterTools.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { createSaveExperienceTool } from '../../tools/saveExperienceTool.js';
import { createGetCurrentTimeTool } from '../../tools/getTimeTool.js';
export const createTools = (twitterApi: TwitterApi) => {
  const twitterTools = createAllTwitterTools(twitterApi);
  const saveExperienceTool = createSaveExperienceTool();
  const getCurrentTimeTool = createGetCurrentTimeTool();

  return {
    ...twitterTools,
    saveExperienceTool,
    getCurrentTimeTool,
    tools: [...twitterTools.tools, saveExperienceTool, getCurrentTimeTool],
  };
};
