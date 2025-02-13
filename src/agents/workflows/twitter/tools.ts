import { createAllTwitterTools } from '../../tools/twitter/index.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createVectorDbSearchTool } from '../../tools/vector/index.js';
import { config } from '../../../config/index.js';
export const createTools = (twitterApi: TwitterApi, vectorDb: VectorDB) => {
  const twitterTools = createAllTwitterTools(twitterApi, config.twitterConfig.POST_TWEETS);
  const saveExperienceTool = createSaveExperienceTool(config.autoDriveConfig.AUTO_DRIVE_UPLOAD);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);
  return {
    ...twitterTools,
    saveExperienceTool,
    getCurrentTimeTool,
    vectorDbSearchTool,
    tools: [...twitterTools.tools, saveExperienceTool, getCurrentTimeTool, vectorDbSearchTool],
  };
};
