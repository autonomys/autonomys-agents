import { createAllTwitterTools } from '../../tools/twitter/twitterTools.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { createSaveExperienceTool } from '../../tools/dsn/saveExperienceTool.js';
import { createGetCurrentTimeTool } from '../../tools/time/getTimeTool.js';
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
