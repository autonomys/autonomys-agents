import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
<<<<<<< HEAD
import {
  createVectorDbSearchTool,
  createExperienceVectorDbSearchTool,
} from '../../tools/vectorDb/index.js';
=======
import { createVectorDbSearchTool } from '../../tools/vectorDb/index.js';
>>>>>>> origin/main

export const createDefaultOrchestratorTools = (
  vectorDb: VectorDB,
  uploadEnabled: boolean = false,
) => {
<<<<<<< HEAD
  const experienceVectorDb = new VectorDB('experiences');
  const saveExperienceTool = createSaveExperienceTool(uploadEnabled);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);
  const experienceVectorDbSearchTool = createExperienceVectorDbSearchTool(experienceVectorDb);
  return [saveExperienceTool, getCurrentTimeTool, vectorDbSearchTool, experienceVectorDbSearchTool];
=======
  const saveExperienceTool = createSaveExperienceTool(uploadEnabled);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);

  return [saveExperienceTool, getCurrentTimeTool, vectorDbSearchTool];
>>>>>>> origin/main
};
