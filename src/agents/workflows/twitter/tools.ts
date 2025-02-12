import { createAllTwitterTools } from '../../tools/twitter/index.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { createSaveExperienceTool } from '../../tools/autonomysAutoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
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
