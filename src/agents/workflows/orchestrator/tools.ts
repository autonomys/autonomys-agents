import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createSaveExperienceTool } from '../../tools/autoDrive/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createExperienceVectorDbSearchTool } from '../../tools/vectorDb/index.js';

export const createDefaultOrchestratorTools = (saveExperiencesToDsn: boolean = false) => {
  const experienceVectorDb = getVectorDB('experiences');
  const updateExperienceVectorDb = (data: unknown) =>
    experienceVectorDb.insert(JSON.stringify(data));
  const searchExperienceVectorDb = (params: {
    query: string;
    metadataFilter?: string;
    limit?: number;
  }) => experienceVectorDb.search(params);

  const saveExperienceTool = createSaveExperienceTool(
    saveExperiencesToDsn,
    updateExperienceVectorDb,
  );
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const experienceVectorDbSearchTool = createExperienceVectorDbSearchTool(searchExperienceVectorDb);
  return [saveExperienceTool, getCurrentTimeTool, experienceVectorDbSearchTool];
};
