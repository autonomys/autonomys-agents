import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createWorkflowSummaryNode } from './nodes/workflowSummaryNode.js';
import { OrchestratorConfig } from './types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

export const createNodes = async (config: OrchestratorConfig, vectorStore: VectorDB) => {
  const inputNode = createInputNode(config, vectorStore);
  const messageSummaryNode = createMessageSummaryNode(config, vectorStore);
  const workflowSummaryNode = createWorkflowSummaryNode(config, vectorStore);
  const toolNode = config.toolNode;

  return {
    inputNode,
    messageSummaryNode,
    workflowSummaryNode,
    toolNode,
  };
};
