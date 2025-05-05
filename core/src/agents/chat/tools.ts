import { ExperienceManager } from '../../blockchain/agentExperience/types.js';
import { getVectorDB } from '../../services/vectorDb/vectorDBPool.js';
import { createAgentExperienceTools } from '../tools/agentExperiences/index.js';
import { createGetCurrentTimeTool } from '../tools/time/index.js';
import { LLMFactoryConfig } from '../../services/llm/types.js';
import { createSchedulerAddTaskTool } from '../tools/scheduler/index.js';

export const createDefaultChatTools = (
  llmConfig: LLMFactoryConfig,
  dataPath: string,
  experienceManager?: ExperienceManager,
) => {
  const experienceVectorDb = getVectorDB('experiences', llmConfig, dataPath);
  const agentExperienceTools = createAgentExperienceTools(experienceVectorDb, experienceManager);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const schedulerAddTaskTool = createSchedulerAddTaskTool();
  return [...agentExperienceTools, getCurrentTimeTool, schedulerAddTaskTool];
};
