import { createTwitterWorkflowTool } from './workflowTools/twitterWorkflowTool.js';
import { createAllTwitterTools } from '../../tools/twitterTools.js';
import { createVectorDbInsertTool, createVectorDbSearchTool } from '../../tools/vectorDbTools.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createSaveExperienceTool } from '../../tools/saveExperienceTool.js';

export const createTools = (twitterApi: TwitterApi, vectorDb: VectorDB) => {
  const twitterWorkflowTool = createTwitterWorkflowTool();
  const twitterTools = createAllTwitterTools(twitterApi);
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);
  const vectorDbInsertTool = createVectorDbInsertTool(vectorDb);
  const saveExperienceTool = createSaveExperienceTool();

  return {
    ...twitterTools,
    twitterWorkflowTool,
    vectorDbSearchTool,
    vectorDbInsertTool,
    saveExperienceTool,
    tools: [
      ...twitterTools.tools,
      twitterWorkflowTool,
      vectorDbSearchTool,
      vectorDbInsertTool,
      saveExperienceTool,
    ],
  };
};
