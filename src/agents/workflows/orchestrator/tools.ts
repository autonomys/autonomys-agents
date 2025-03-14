import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createSaveExperienceTool } from '../../tools/agentExperiences/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createVectorDbTools } from '../../tools/vectorDb/index.js';

export const createDefaultOrchestratorTools = (saveExperiencesToDsn: boolean = false) => {
  const experienceVectorDb = getVectorDB('experiences');
  const updateExperienceVectorDb = (data: unknown) =>
    experienceVectorDb.insert(JSON.stringify(data));

  const saveExperienceTool = createSaveExperienceTool(
    saveExperiencesToDsn,
    updateExperienceVectorDb,
  );
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const vectorDbTools = createVectorDbTools(experienceVectorDb);
  return [saveExperienceTool, getCurrentTimeTool, ...vectorDbTools];
};
