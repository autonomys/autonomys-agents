import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createFinishWorkflowNode } from './nodes/finishWorkflowNode.js';
import { createDecisionNode } from './nodes/decisionNode.js';
import { OrchestratorConfig } from './types.js';

export const createNodes = async (config: OrchestratorConfig) => {
  const inputNode = createInputNode(config);
  const messageSummaryNode = createMessageSummaryNode(config);
  const finishWorkflowNode = createFinishWorkflowNode(config);
  const decisionNode = createDecisionNode(config);
  const toolNode = config.toolNode;

  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    decisionNode,
    toolNode,
  };
};
