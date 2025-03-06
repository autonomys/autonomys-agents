import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createExperienceVectorDbSearchTool } from '../../tools/vectorDb/index.js';

export const createDefaultOrchestratorTools = (saveExperiences: boolean = false) => {
  const experienceVectorDb = getVectorDB('experiences');
  const updateExperienceVectorDb = (data: unknown) =>
    experienceVectorDb.insert(JSON.stringify(data));
  const saveExperienceTool = createSaveExperienceTool(saveExperiences, updateExperienceVectorDb);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const experienceVectorDbSearchTool = createExperienceVectorDbSearchTool(experienceVectorDb);
  return [saveExperienceTool, getCurrentTimeTool, experienceVectorDbSearchTool];
};
