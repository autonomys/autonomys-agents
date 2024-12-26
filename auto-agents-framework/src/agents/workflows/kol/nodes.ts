import { WorkflowConfig } from './types.js';
import { createCollectDataNode } from './nodes/collectDataNode.js';
export const createNodes = async (config: WorkflowConfig) => {
  ///////////MENTIONS///////////
  const collectDataNode = createCollectDataNode(config);

  return {
    collectDataNode,
  };
};
