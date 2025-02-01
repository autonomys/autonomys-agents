import { createInputNode } from './nodes/inputNode.js';
import { createSummaryNode } from './nodes/summaryNode.js';
import { OrchestratorConfig } from './types.js';

export const createNodes = async (config: OrchestratorConfig) => {
  const inputNode = createInputNode(config);
  const summaryNode = createSummaryNode(config);
  const toolNode = config.toolNode;

  return {
    inputNode,
    summaryNode,
    toolNode,
  };
};
