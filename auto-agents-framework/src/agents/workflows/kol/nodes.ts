import { WorkflowConfig } from './types.js';
import { createCollectDataNode } from './nodes/collectDataNode.js';
import { createAnalyzeTrendNode } from './nodes/analyzeTrendNode.js';

export const createNodes = async (config: WorkflowConfig) => {
  ///////////MENTIONS///////////
  const collectDataNode = createCollectDataNode(config);
  const analyzeTrendNode = createAnalyzeTrendNode(config);

  return {
    collectDataNode,
    analyzeTrendNode,
  };
};
