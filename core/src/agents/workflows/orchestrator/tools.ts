import { ExperienceManager } from '../../../blockchain/agentExperience/types.js';
import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createAgentExperienceTools } from '../../tools/agentExperiences/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createStopWorkflowTool } from '../../tools/stopWorkflow/index.js';
import { createThinkingTool } from '../../tools/thinking/index.js';
import { workflowControlState } from './orchestratorWorkflow.js';
import { LLMFactoryConfig } from '../../../services/llm/types.js';

export const createDefaultOrchestratorTools = (
  namespace: string,
  llmConfig: LLMFactoryConfig,
  dataPath: string,
  experienceManager?: ExperienceManager,
) => {
  const experienceVectorDb = getVectorDB('experiences', llmConfig, dataPath);
  const agentExperienceTools = createAgentExperienceTools(experienceVectorDb, experienceManager);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const stopWorkflowTool = createStopWorkflowTool(workflowControlState, namespace);
  const thinkingTool = createThinkingTool();

  return [...agentExperienceTools, getCurrentTimeTool, stopWorkflowTool, thinkingTool];
};
