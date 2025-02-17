import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createVectorDbSearchTool } from '../../tools/vectorDb/index.js';

export const createDefaultOrchestratorTools = (vectorDb: VectorDB) => {
  const saveExperienceTool = createSaveExperienceTool();
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);

  return [saveExperienceTool, getCurrentTimeTool];
};
