import { getVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createAgentExperienceTools } from '../../tools/agentExperiences/index.js';
import { createGetCurrentTimeTool } from '../../tools/time/index.js';
import { createStopWorkflowTool } from '../../tools/stopWorkflow/index.js';
import { workflowControlState } from './orchestratorWorkflow.js';

export const createDefaultOrchestratorTools = (
  saveExperiencesToDsn: boolean = false,
  namespace: string,
) => {
  const experienceVectorDb = getVectorDB('experiences');
  const agentExperienceTools = createAgentExperienceTools(saveExperiencesToDsn, experienceVectorDb);
  const getCurrentTimeTool = createGetCurrentTimeTool();
  const stopWorkflowTool = createStopWorkflowTool(workflowControlState, namespace);

  return [...agentExperienceTools, getCurrentTimeTool, stopWorkflowTool];
};
