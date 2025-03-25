import { ExperienceManager } from '../../../blockchain/agentExperience/types.js';
import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createAgentExperienceTools } from '../../tools/agentExperiences/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';

export const createDefaultOrchestratorTools = (experienceManager?: ExperienceManager) => {
  const experienceVectorDb = getVectorDB('experiences');
  const agentExperienceTools = createAgentExperienceTools(experienceVectorDb, experienceManager);
  const getCurrentTimeTool = createGetCurrentTimeTool();

  return [...agentExperienceTools, getCurrentTimeTool];
};
