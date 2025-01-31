import { createTwitterWorkflowTool } from './workflowTools/twitterWorkflowTool.js';
import { createAllTwitterTools } from '../../tools/twitterTools.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { createSaveExperienceTool } from '../../tools/saveExperienceTool.js';
import { createGetCurrentTimeTool } from '../../tools/getTimeTool.js';
export const createTools = (twitterApi: TwitterApi) => {
  const twitterWorkflowTool = createTwitterWorkflowTool();
  const twitterTools = createAllTwitterTools(twitterApi);
  const saveExperienceTool = createSaveExperienceTool();
  const getCurrentTimeTool = createGetCurrentTimeTool();

  return {
    ...twitterTools,
    twitterWorkflowTool,
    saveExperienceTool,
    getCurrentTimeTool,
    tools: [...twitterTools.tools, twitterWorkflowTool, saveExperienceTool, getCurrentTimeTool],
  };
};
