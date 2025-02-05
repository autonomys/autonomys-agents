import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createFinishWorkflowNode } from './nodes/finishWorkflowNode.js';
import { OrchestratorConfig } from './types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

export const createNodes = async (config: OrchestratorConfig) => {
  const inputNode = createInputNode(config);
  const messageSummaryNode = createMessageSummaryNode(config);
  const finishWorkflowNode = createFinishWorkflowNode(config);
  const toolNode = config.toolNode;

  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolNode,
  };
};
