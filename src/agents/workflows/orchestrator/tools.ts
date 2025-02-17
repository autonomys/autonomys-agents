import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createVectorDbSearchTool } from '../../tools/vectorDb/index.js';

export const createDefaultOrchestratorTools = (
  vectorDb: VectorDB,
  uploadEnabled: boolean = false,
) => {
  const saveExperienceTool = createSaveExperienceTool(uploadEnabled);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);

  return [saveExperienceTool, getCurrentTimeTool, vectorDbSearchTool];
};
