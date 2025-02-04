import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createWorkflowSummaryNode } from './nodes/workflowSummaryNode.js';
import { OrchestratorConfig } from './types.js';

export const createNodes = async (config: OrchestratorConfig) => {
  const inputNode = createInputNode(config);
  const messageSummaryNode = createMessageSummaryNode(config);
  const workflowSummaryNode = createWorkflowSummaryNode(config);
  const toolNode = config.toolNode;

  return {
    inputNode,
    messageSummaryNode,
    workflowSummaryNode,
    toolNode,
  };
};
