import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createAgentExperienceTools } from '../../tools/agentExperiences/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';

export const createDefaultOrchestratorTools = (saveExperiencesToDsn: boolean = false) => {
  const experienceVectorDb = getVectorDB('experiences');
  const agentExperienceTools = createAgentExperienceTools(saveExperiencesToDsn, experienceVectorDb);
  const getCurrentTimeTool = createGetCurrentTimeTool();

  return [...agentExperienceTools, getCurrentTimeTool];
};
