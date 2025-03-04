import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import {
  createExperienceVectorDbSearchTool,
  createVectorDbSearchTool,
} from '../../tools/vectorDb/index.js';

export const createDefaultOrchestratorTools = (
  vectorDb: VectorDB,
  saveExperiences: boolean = false,
) => {
  const experienceVectorDb = new VectorDB('experiences');
  const updateExperienceVectorDb = (data: unknown) =>
    experienceVectorDb.insert(JSON.stringify(data));
  const saveExperienceTool = createSaveExperienceTool(saveExperiences, updateExperienceVectorDb);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbSearchTool = createVectorDbSearchTool(vectorDb);
  const experienceVectorDbSearchTool = createExperienceVectorDbSearchTool(experienceVectorDb);
  return [saveExperienceTool, getCurrentTimeTool, vectorDbSearchTool, experienceVectorDbSearchTool];
};
